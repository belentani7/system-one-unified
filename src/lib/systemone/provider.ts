import type { ChoiceQuestion, DecideRequest, Question, ScoreQuestion } from "./schema";
import { isChoice, isNoul, isScore } from "./schema";

export type RawScores = Record<string, Record<string, number>>;

/**
 * Resultado de un backend de scoring.
 *
 * `scores` son puntuaciones crudas: el motor las normaliza con softmax. Un
 * backend que YA devuelve probabilidades calibradas (Laya, entrenado con RLCD)
 * las entrega como log-probabilidades, porque softmax(ln p) = p exactamente, y
 * ademas rellena `confidence` para que el motor no vuelva a estimarla con su
 * heuristica de margen. Si `confidence` viene vacio, el motor calibra el mismo.
 */
export interface ProviderResult {
  scores: RawScores;
  /** Confianza por pregunta aportada por el propio backend, si la tiene. */
  confidence?: Record<string, number>;
  /** Nombre del backend que decidio, para auditoria. */
  backend: string;
  /** Metadatos opcionales del backend (Laya devuelve el checkpoint elegido). */
  routing?: unknown;
}

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLocaleLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 2),
  );
}

/** Longitud minima de raiz compartida para aceptar una coincidencia parcial. */
const MIN_STEM = 4;

/**
 * Coincidencia tolerante a morfologia. La comparacion exacta fallaba en espanol
 * y portugues por los plurales y las derivaciones ("cobro" vs "cobros",
 * "reembolso" vs "reembolsos"), lo que dejaba la distribucion plana y obligaba a
 * escalar decisiones que si eran claras. Aceptamos que un token sea prefijo del
 * otro siempre que la raiz compartida tenga al menos MIN_STEM caracteres, para
 * no emparejar palabras cortas no relacionadas. Sigue siendo determinista.
 */
function sameStem(a: string, b: string): boolean {
  if (a === b) return true;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  return shorter.length >= MIN_STEM && longer.startsWith(shorter);
}

function overlap(state: Set<string>, description: string): number {
  const words = tokens(description);
  if (words.size === 0) return 0;
  let matches = 0;
  for (const word of words) {
    for (const stateWord of state) {
      if (sameStem(word, stateWord)) {
        matches += 1;
        break;
      }
    }
  }
  return matches / Math.sqrt(words.size);
}

function sentiment(state: string): number {
  const text = state.toLocaleLowerCase();
  const strong = ["furioso", "furious", "angry", "inaceptable", "amenaza", "cancelar", "urgente", "urgency", "exijo", "error 500", "caido", "bloqueado"];
  return strong.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
}

/**
 * Offline scorer. It is deliberately deterministic: same state and schema,
 * same scores. It never invents an answer outside the supplied schema.
 * This is a portable baseline, not a claim of consciousness or truth.
 */
export function scoreOffline(request: DecideRequest): RawScores {
  const stateText = typeof request.state === "string" ? request.state : JSON.stringify(request.state);
  const state = tokens(stateText);
  const mood = sentiment(stateText);
  const result: RawScores = {};

  for (const [key, question] of Object.entries(request.questions)) {
    if (isChoice(question)) {
      const q = question as ChoiceQuestion;
      result[key] = {};
      for (const [option, description] of Object.entries(q.criteria)) {
        result[key]![option] = overlap(state, `${option} ${description}`) * 8;
      }
    } else if (isScore(question)) {
      const q = question as ScoreQuestion;
      result[key] = {};
      q.criteria.forEach((label, index) => {
        const base = overlap(state, label) * 8;
        const intensity = q.criteria.length > 1 ? (index / (q.criteria.length - 1)) * mood : 0;
        result[key]![String(index)] = base + intensity;
      });
    } else if (isNoul(question)) {
      const yes = overlap(state, question.instructions) * 6 + mood * 0.8;
      result[key] = { yes };
    }
  }
  return result;
}

/* ---------- Backend: Laya (System One abierto, Apache-2.0) ---------- */

/**
 * Laya (convaiinnovations/laya) es un modelo de decision no autorregresivo de
 * 421M sobre ModernBERT-large, entrenado con RLCD. Su servidor `laya-serve`
 * expone `POST /v1/systemone` con EL MISMO contrato que este proyecto, asi que
 * aqui solo reenviamos `state` + `questions` y traducimos la respuesta.
 *
 * Laya devuelve probabilidades ya calibradas, no puntuaciones crudas. Las
 * convertimos a log-probabilidades porque softmax(ln p) = p, de modo que el
 * motor reproduce la distribucion de Laya sin distorsionarla, y pasamos su
 * `confidence` tal cual en vez de recalcularla con la heuristica de margen.
 *
 * Arrancarlo:  pip install "laya[serve]" && laya-serve
 * Configurar:  DECISION_BACKEND=laya  DECISION_LAYA_URL=http://127.0.0.1:8000
 */

interface LayaAnswer {
  choice?: string;
  score?: number;
  noul?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
}

interface LayaResponse {
  answers?: Record<string, LayaAnswer>;
  routing?: unknown;
}

/** Suelo para ln(0): mantiene el logaritmo finito sin alterar el argmax. */
const LOG_FLOOR = -30;

function toLogProbs(probabilities: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, p] of Object.entries(probabilities)) {
    out[key] = p > 0 ? Math.log(p) : LOG_FLOOR;
  }
  return out;
}

/** logit(p), para que el sigmoid del motor recupere p exactamente. */
function toLogit(p: number): number {
  const eps = 1e-6;
  const clamped = Math.min(1 - eps, Math.max(eps, p));
  return Math.log(clamped / (1 - clamped));
}

async function scoreLaya(request: DecideRequest): Promise<ProviderResult> {
  const base = (process.env.DECISION_LAYA_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
  const apiKey = process.env.DECISION_LAYA_API_KEY;

  const response = await fetch(`${base}/v1/systemone`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    // El contrato coincide: reenviamos state y questions sin transformar.
    body: JSON.stringify({ state: request.state, questions: request.questions }),
    signal: AbortSignal.timeout(Number(process.env.DECISION_LAYA_TIMEOUT_MS ?? 30000)),
  });
  if (!response.ok) {
    throw new Error(`Laya HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }

  const payload = (await response.json()) as LayaResponse;
  const scores: RawScores = {};
  const confidence: Record<string, number> = {};

  for (const [key, question] of Object.entries(request.questions)) {
    const answer = payload.answers?.[key];
    if (!answer) continue;

    if (isNoul(question)) {
      // El valor noul ya ES la probabilidad; el motor le aplica sigmoid.
      scores[key] = { yes: toLogit(answer.noul ?? 0.5) };
      continue;
    }
    if (answer.probabilities) {
      scores[key] = toLogProbs(answer.probabilities);
    }
    if (typeof answer.confidence === "number") {
      confidence[key] = answer.confidence;
    }
  }

  return { scores, confidence, backend: "laya", routing: payload.routing };
}

async function scoreRemote(
  request: DecideRequest,
  systemPrompt: string,
  userPrompt: string,
): Promise<RawScores> {
  const endpoint = process.env.DECISION_MODEL_URL;
  if (!endpoint) throw new Error("DECISION_MODEL_URL is not set");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.DECISION_MODEL_API_KEY
        ? { authorization: `Bearer ${process.env.DECISION_MODEL_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      model: process.env.DECISION_MODEL_NAME ?? request.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(Number(process.env.DECISION_MODEL_TIMEOUT_MS ?? 30000)),
  });
  if (!response.ok) throw new Error(`Decision model HTTP ${response.status}`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content) as RawScores;
}

/**
 * Elige el backend segun DECISION_BACKEND:
 *
 *   offline (default) -> scoreOffline, determinista, sin red
 *   laya              -> scoreLaya, servidor laya-serve Jev-compatible
 *   openai-compatible -> scoreRemote, cualquier /chat/completions
 *   auto              -> laya si hay DECISION_LAYA_URL, si no el modelo remoto,
 *                        si no offline
 *
 * Ningun backend puede tumbar el servicio: si el externo falla, se registra y
 * se cae al offline, que siempre responde.
 */
function resolveBackend(): string {
  const backend = process.env.DECISION_BACKEND ?? "offline";
  if (backend !== "auto") return backend;
  if (process.env.DECISION_LAYA_URL) return "laya";
  if (process.env.DECISION_MODEL_URL) return "openai-compatible";
  return "offline";
}

export async function scoreRequest(
  request: DecideRequest,
  systemPrompt: string,
  userPrompt: string,
): Promise<ProviderResult> {
  const backend = resolveBackend();

  if (backend === "laya") {
    try {
      return await scoreLaya(request);
    } catch (error) {
      console.error("[provider] laya failed, falling back to offline:", error);
      return { scores: scoreOffline(request), backend: "offline-deterministic (laya fallback)" };
    }
  }

  if (backend === "openai-compatible") {
    try {
      return {
        scores: await scoreRemote(request, systemPrompt, userPrompt),
        backend: "openai-compatible",
      };
    } catch (error) {
      console.error("[provider] remote model failed, falling back to offline:", error);
      return {
        scores: scoreOffline(request),
        backend: "offline-deterministic (remote fallback)",
      };
    }
  }

  return { scores: scoreOffline(request), backend: "offline-deterministic" };
}

export function providerName(): string {
  const backend = resolveBackend();
  if (backend === "laya") return "laya";
  if (backend === "openai-compatible") return "openai-compatible";
  return "offline-deterministic";
}
