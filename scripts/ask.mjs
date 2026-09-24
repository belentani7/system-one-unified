/**
 * ask.mjs — lanza un fichero de preguntas contra el endpoint y ordena las
 * respuestas por confianza.
 *
 * El valor de este motor no es acertar una pregunta: es responder muchas sobre
 * el mismo estado por el coste de leerlo una vez. Pero de veinte respuestas no
 * todas valen lo mismo, y la que importa es cuales puedes creerte. Este script
 * separa las tres zonas:
 *
 *   FIABLE    confianza por encima del umbral
 *   ESCALA    por debajo: el motor dice que no sabe, no te fies
 *   (noul)    se marca aparte, porque puede seguir sus etiquetas en vez del
 *             estado (laya issue #156); usa choice de dos opciones si importa
 *
 * Uso:
 *   node scripts/ask.mjs examples/repo-audit.json
 *   PORT=3100 node scripts/ask.mjs examples/repo-audit.json
 *   SMOKE_BASE_URL=http://otra-maquina:3000 node scripts/ask.mjs fichero.json
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const file = process.argv[2];
if (!file) {
  console.error("uso: node scripts/ask.mjs <fichero.json>");
  process.exit(1);
}

const base = process.env.SMOKE_BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3000}`;
const payload = JSON.parse(await readFile(resolve(file), "utf8"));
// Las claves que empiezan por _ son notas para humanos, no van al motor.
for (const key of Object.keys(payload)) if (key.startsWith("_")) delete payload[key];

const started = Date.now();
const response = await fetch(`${base}/v1/systemone`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload),
});
if (!response.ok) {
  console.error(`HTTP ${response.status}: ${await response.text()}`);
  process.exit(1);
}
const result = await response.json();
const roundTrip = Date.now() - started;

const rows = Object.entries(result.answers).map(([key, answer]) => {
  if (answer.type === "choice") {
    return { key, type: "choice", value: answer.choice, confidence: answer.confidence };
  }
  if (answer.type === "score") {
    const level = answer.legend?.[String(Math.round(answer.score))] ?? "";
    return { key, type: "score", value: `${answer.score} ${level}`.trim(), confidence: answer.confidence };
  }
  return { key, type: "noul", value: String(answer.noul), confidence: null };
});

const escalated = new Set(result.escalated_questions ?? []);
const trusted = rows.filter((r) => r.confidence !== null && !escalated.has(r.key));
const weak = rows.filter((r) => r.confidence !== null && escalated.has(r.key));
const nouls = rows.filter((r) => r.confidence === null);

const byConfidence = (a, b) => b.confidence - a.confidence;
const pad = (s, n) => String(s).padEnd(n).slice(0, n);

function print(title, list, withConfidence = true) {
  if (list.length === 0) return;
  console.log(`\n${title}`);
  for (const row of list.sort(withConfidence ? byConfidence : () => 0)) {
    const conf = withConfidence ? ` ${row.confidence.toFixed(3)}` : "      ";
    console.log(`  ${conf}  ${pad(row.key, 24)} ${row.value}`);
  }
}

console.log(`estado     : ${String(payload.state).slice(0, 72)}...`);
console.log(`backend    : ${result.backend ?? "?"}`);
console.log(`preguntas  : ${rows.length} en ${result.latency_ms} ms de motor (${roundTrip} ms ida y vuelta)`);
console.log(`coste      : ${result.usage.input_tokens} tokens de entrada, ${result.usage.output_tokens} de salida`);
console.log(`por pregunta: ${(result.latency_ms / rows.length).toFixed(1)} ms`);

print(`FIABLE (confianza >= ${payload.confidence_threshold ?? 0.6})`, trusted);
print("ESCALA (el motor no sabe: no uses estas)", weak);
print("NOUL (sin confianza propia, verificar a mano)", nouls, false);

console.log(
  `\nresumen: ${trusted.length} de ${rows.length} respuestas utilizables` +
    (weak.length ? `, ${weak.length} escaladas` : "") +
    (nouls.length ? `, ${nouls.length} noul sin calibrar` : ""),
);
