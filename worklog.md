# System One Local — Worklog

## Estado actual del proyecto

**System One Local** es una réplica en Next.js 16 del contrato `/v1/systemone` de TypeSafe AI (Jev): un modelo de **decisión tipada** que recibe un `state` + un esquema de preguntas (`choice` / `noul` / `score`) y devuelve decisiones estructuradas con `value + confidence`. Cero generación de texto libre → cero alucinación.

El proyecto está **funcional y verificado end-to-end** con agent-browser. La API responde, el motor LLM devuelve decisiones calibradas, el historial persiste en SQLite (Prisma) y la UI renderiza en claro/oscuro y móvil.

## Objetivos / modificaciones completadas

### Arquitectura
- **`src/lib/systemone/schema.ts`** — Esquemas Zod v4 para `Choice`, `Noul`, `Score`, `Question`, `Answer`, `DecideRequest`, `DecideResponse` (contrato TypeSafe-compatible). Helpers `isChoice/isScore/isNoul` y `PRIMITIVE_META` con metadatos visuales.
- **`src/lib/systemone/confidence.ts`** — Calibración: `softmax` con temperatura estabilizada, `calibrate` (penaliza decisiones ambiguas por margen top-1/top-2), `argmax`, `weightedScore` (posición ponderada para `Score`), `shouldEscalate` (umbrales + zona gris 0.3–0.7 para `Noul`), `estimateTokens`.
- **`src/lib/systemone/engine.ts`** — Motor "parallel sampler": en una sola pasada LLM scorea TODAS las opciones de TODAS las preguntas sobre el mismo prefill. El LLM actúa como *scorer* (no genera prosa, solo JSON de scores crudos), y el engine normaliza con softmax + sigmoid y calibra el confidence. Singletón de `z-ai-web-dev-sdk`.
- **`src/lib/systemone/presets.ts`** — 4 presets listos: triaje de tickets, moderación, enrutado de agente, clasificación de facturas.
- **`src/lib/systemone/index.ts`** — Barrel PÚBLICO (no reexporta `engine.ts` para no arrastrar `z-ai-web-dev-sdk` server-only al bundle cliente).

### Base de datos
- `prisma/schema.prisma` — modelo `DecisionLog` (state, questionsJson, answersJson, latency, tokens, escalación, threshold, timestamps) con índices en `createdAt` y `requiresEscalation`. `bun run db:push` ejecutado.

### API (contrato `/v1/systemone`)
- **`POST /api/decide`** — Recibe `{state, model, questions, confidence_threshold, temperature}`, valida con Zod, ejecuta el motor, persiste en `DecisionLog` y devuelve `{model, answers, usage:{input_tokens,output_tokens:0}, latency_ms, requires_escalation, escalated_questions}`.
- **`GET /api/presets`** — Lista los 4 presets.
- **`GET /api/history?limit=N`** / **`DELETE /api/history`** — Histórico y borrado.

### UI (playground en `/`)
- **`src/app/page.tsx`** — Playground completo: editor de `state` (textarea + token estimate), editor visual de preguntas (añadir/editar/eliminar choice/noul/score con sus opciones), settings (slider de umbral + temperatura), botón Run, panel de resultado con métricas (modelo, latencia, tokens, escalación), grid de tarjetas de decisión, visor JSON colapsable del contrato request/response, e historial reciente clickable. Hero con badges y mini-stats agregadas (avg latency, escalation rate, contador).
- **`src/components/systemone/`** — `confidence-meter.tsx` (barra con marcador de threshold), `probability-bars.tsx` (barras horizontales con ganador resaltado), `escalation-badge.tsx`, `primitive-icon.tsx` (chips CHOICE/Noul/Score con colores), `decision-card.tsx` (tarjeta por pregunta con sub-views para cada primitiva), `question-editor.tsx`, `result-metrics.tsx`, `preset-card.tsx`, `json-viewer.tsx`.
- **`src/components/theme-provider.tsx`** + **`theme-toggle.tsx`** — Soporte claro/oscuro con `next-themes`.
- **Layout** — Sticky header (top), `main flex-1`, footer `mt-auto` (sticky al fondo). Metadata actualizada a "System One Local — typed decisions, not prose".

## Verificación (agent-browser + VLM)
- **API curl directo**: `POST /api/decide` con ticket de soporte → `department=account` (confidence 1.0), `is_angry=1.0`, `frustration=2` (Furious, confidence 0.999). Latencia 1551ms. ✅
- **UI flujo completo**: clic en "Run decision" → renderiza 3 tarjetas (Choice/Noul/Score) con badges, barras de probabilidad, medidores de confianza con marcador de umbral, badge de escalación. VLM confirmó "clean and professional layout", "decision cards clearly visible", "confidence meters and probability bars well-formatted". ✅
- **Tema oscuro**: toggle funciona, VLM confirmó "dark theme correctly applied", "no contrast issues", "accent colors pop effectively". ✅
- **Mobile 390px**: single column, sin overflow, header bien dimensionado, footer al fondo sin overlap. VLM: "fully mobile-optimized". ✅
- **Historial**: persiste decisiones en SQLite, recarga tras cada run, clickable para revisar decisiones pasadas. ✅
- **Sticky footer**: verificado en mobile y desktop. ✅
- **Lint**: `bun run lint` limpio. ✅

## Limitaciones / notas
- **Latencia variable (1.5s – 23s)**: Jev real promete 70–500ms porque usa un modelo System One entrenado con RLCD + parallel sampler nativo. Nosotros usamos el LLM hosted del SDK como *adapter*: el LLM scorea opciones y nosotros normalizamos. Es una réplica del **contrato**, no de la **arquitectura interna**. Para latencia real habría que desplegar un modelo local (Kev-4B / Mapika/decider / Laya) — fuera del sandbox Next.js.
- **Confidence calibrado por aproximación**: sin RLCD real, usamos softmax + penalización por margen top-1/top-2. Funciona razonablemente (decisión clara → 0.99–1.0, decisión ambigua → baja). Para calibración estadística real haría falta un set de validación con isotonic regression.
- **Zod v4**: `z.record(...).min(1)` no existe → cambiado a `.refine(rec => Object.keys(rec).length >= 1)`.
- **Bundle cliente**: el barrel `index.ts` no reexporta `engine.ts` (que importa `z-ai-web-dev-sdk` server-only con `fs/promises`) para no romper la compilación del Client Component `page.tsx`. La API route importa `decide` directamente desde `./engine`.

## Próximos pasos sugeridos
1. **Calibración con isotonic regression** sobre un set de validación etiquetado (ej: 100 tickets ya triaged por humanos) para que confidence=0.8 ≈ 80% de acierto real.
2. **Streaming del JSON**: ahora esperamos al JSON completo; se podría tokenizar el stream para mostrar scores parcialmente (mejora UX percibida).
3. **Comparativa A/B**: dejar correr el mismo state por dos motores (local vs. Jev real vía API) y comparar latency + agreement.
4. **WebSocket live updates** del historial (mini-service en puerto 3003 vía gateway Caddy) para que nuevas decisiones aparezcan sin refresh.
5. **Export CSV / JSON** del historial para análisis offline.
6. **Más presets**: clasificación de emails (sales/support/spam), detección de PII, routing multilingüe.

---

## Consolidación 2026-09-23 — de paquete a proyecto que corre

El proyecto existía en dos copias: el snapshot del workspace (`.tar`, sin
`provider.ts` ni ruta `/v1/systemone`) y el paquete portable (`.zip`, con ambos).
Se tomó el portable como base canónica, sin reescribir la arquitectura, y se
arregló lo que impedía que arrancara fuera de Manus.

### Arreglado

1. **`DATABASE_URL` apuntaba a una ruta absoluta de Manus**
   (`file:/home/z/my-project/db/custom.db`). Ahora es `file:../db/custom.db`.
   Prisma resuelve las rutas SQLite relativas desde `prisma/`, así que `../db`
   deja el fichero en `db/` en la raíz, como en el layout original.

2. **Scripts sólo POSIX.** `build` usaba `cp -r` y `start` el prefijo
   `NODE_ENV=production`, que rompen en Windows. Sustituidos por
   `scripts/postbuild.mjs` y `scripts/start.mjs` en Node puro. Mismo
   comportamiento, cualquier plataforma.

3. **Cuatro errores de tipo reales** que `typescript.ignoreBuildErrors: true`
   tapaba en `next.config.ts`:
   - `presets.ts` tipaba los presets literales como `DecideRequest`, que es la
     forma de *salida* del schema (con los `.default()` de Zod ya aplicados y por
     tanto obligatorios). Se añadió `DecideInput` (`z.input<...>`) para la forma
     de *entrada*.
   - `decision-card.tsx` pasaba la unión `Question` sin estrechar a las tres
     subvistas. El discriminante de la respuesta no dice nada del tipo de la
     pregunta; ahora se estrecha con `isChoice` / `isNoul` / `isScore`.
   - `examples/websocket/*` son restos del scaffold, sin relación con System One
     y con dependencias (`socket.io`) que no se instalan. Excluidos de
     `tsconfig.json`.
   `tsc --noEmit` y `eslint .` quedan limpios.

4. **Bug del scorer offline: los plurales españoles no casaban.** `overlap()`
   comparaba tokens por igualdad exacta, así que "cobro" no casaba con "Cobros"
   ni "reembolso" con "reembolsos". El caso de prueba canónico (cobro duplicado →
   `billing`) devolvía una distribución **uniforme** 0.333/0.333/0.333: acertaba
   sólo por el orden de las claves, con confianza 0.217. Se añadió coincidencia
   por raíz compartida de al menos 4 caracteres (`sameStem`), determinista y sin
   dependencias. El mismo caso pasa a **0.998 de confianza**.

5. **Smoke test con puerto fijo.** Leía `127.0.0.1:3100` a pelo; ahora respeta
   `PORT` y `SMOKE_BASE_URL`. Expuesto como `npm run smoke`.

6. Comentario obsoleto del barrel: ya no existe `z-ai-web-dev-sdk`. El motor
   sigue siendo server-only, pero por `provider.ts` (lee `process.env`, hace
   `fetch`), no por el SDK privado.

### Verificado en ejecución, no sólo compilado

- `npm run build` → 7 rutas, incluida `ƒ /v1/systemone`.
- `GET /api/decide` → health check ok.
- `npm run smoke` → 3 primitivas resueltas en **9 ms**, backend offline, sin red.
- `GET /api/presets` → 4 presets.
- `GET /api/history` → decisiones persistidas en SQLite, UTF-8 correcto.
- `GET /` → la página se sirve.
- Esquema inválido (`score` con un solo criterio) → **400** con el issue exacto
  de Zod. La salida está acotada: el motor no puede devolver una etiqueta que no
  esté en el esquema del cliente.
- Estado ambiguo ("Hola.") con umbral 0.8 → 50/50, confianza 0.325,
  `requires_escalation: true`, `escalated_questions: ["team"]`. Escala en vez de
  inventar.

### Lo que sigue sin ser cierto

El modo offline es una función de coincidencia de términos e intensidad. Es
reproducible y auditable, y por eso sirve como base portable, pero no entiende
el significado: un estado parafraseado sin compartir palabras con los criterios
caerá en distribución plana y escalará. Para decisiones semánticas hay que
conectar un modelo por `DECISION_BACKEND=openai-compatible`. La confianza
calibrada por margen tampoco equivale a exactitud real mientras no se calibre
contra un conjunto de casos etiquetados del dominio.

---

## Tercera versión 2026-09-23 — Laya entra como backend, el offline no se toca

`Laya` (Convai Innovations, Apache-2.0) es real y resultó ser la pieza que
faltaba: un System One abierto de 421M sobre ModernBERT-large, entrenado con
**RLCD** — el mismo método que TypeSafe usa en Jev — y su servidor `laya-serve`
expone `POST /v1/systemone` **con el mismo contrato que este proyecto**. No hubo
que adaptar nada del esquema: se reenvían `state` y `questions` tal cual.

### Cómo encaja sin romper nada

`provider.ts` ya tenía un conmutador de backend. Se añadió `laya` junto a
`offline` y `openai-compatible`. El offline sigue siendo el valor por defecto y
su código no cambió.

El punto delicado: Laya devuelve **probabilidades ya calibradas**, no
puntuaciones crudas, y el motor esperaba crudas para pasarlas por softmax.
Volver a normalizar habría deformado una distribución que ya era honesta. La
solución no fue tocar el motor sino convertir en el proveedor:

- `choice` / `score`: se entregan **log-probabilidades**, porque
  `softmax(ln p) = p` exactamente. El motor reproduce la distribución de Laya
  dígito a dígito.
- `noul`: se entrega **logit(p)**, porque el motor aplica `sigmoid`, y
  `sigmoid(logit(p)) = p`.
- `confidence`: se pasa tal cual. La heurística de margen del proyecto es una
  aproximación honesta cuando no hay nada mejor, pero degradaría una confianza
  entrenada con RLCD, así que `backendConfidence ?? calibrate(...)`.

La respuesta gana un campo `backend`, opcional y aditivo (un cliente Jev lo
ignora), para saber qué cerebro decidió cada caso.

### Probado con un servidor Laya falso, no simulado a ojo

`tests/laya-mock.mjs` devuelve la forma exacta documentada en el README de
`convaiinnovations/laya`, con números deliberadamente distintos de los que
produciría el scorer offline, para que la prueba distinga de verdad quién
decidió. Resultado:

| campo | Laya devolvió | el motor produjo |
|---|---|---|
| `team.probabilities` | `billing 0.94 / technical 0.04 / account 0.02` | idéntico |
| `team.confidence` | `0.94` | `0.94` (no recalculado) |
| `urgent.noul` | `0.892` | `0.892` |
| `frustration.probabilities` | `0.12 / 0.58 / 0.30` | idéntico |
| `frustration.score` | — | `1.18` = 0·0.12 + 1·0.58 + 2·0.30 |
| `frustration.confidence` | `0.58` | `0.58` → escala, 0.58 < umbral 0.6 |

El `legend` lo sigue construyendo el proyecto desde `criteria`, porque Laya no
lo devuelve.

**Caída del backend:** matado el servidor Laya, la misma petición respondió en
17 ms con `backend: "offline-deterministic (laya fallback)"`. El servicio no se
cae y la respuesta declara quién decidió realmente. Eso importa más que el
acierto: una decisión tomada por el fallback no debe parecer una decisión de
Laya.

### Lo que todavía no está probado

La integración está verificada contra la forma documentada de la respuesta, no
contra el modelo real: `pip install "laya[serve]"` descarga ~808 MB de pesos más
torch. El paso siguiente es arrancarlo de verdad y medir acierto y latencia
frente al offline sobre los mismos casos. Hasta hacerlo, lo honesto es decir que
el cableado es correcto, no que Laya rinda aquí lo que rinde en su benchmark.

Alternativas al servidor Python, por si interesa evitarlo: `laya-ts` (paquete
TypeScript oficial, Node y navegador) y `@receptron/laya` (ONNX Runtime, pesos
de ~1.7 GB cacheados). Ambas hablan las mismas tres primitivas.

---

## Versión Belentani 2026-09-23 — cinco presets del ecosistema real

`presets.noiacore.ts` añade cinco casos que corresponden a proyectos que ya
existen, sin tocar los cuatro genéricos. Los umbrales no son iguales a
propósito: equivocarse con un repo cuesta un minuto; equivocarse con una persona
que pide ayuda cuesta otra cosa. Por eso `manos-abiertas-acogida` va a 0.85 y
lleva una pregunta explícita de derivación humana.

### Medido con el backend offline

| preset | resultado | lectura |
|---|---|---|
| `repo-triage` | `fusionar` 0.886, `riesgo_secretos` 0.992 | funciona hoy |
| `noiacore-agent-routing` | `code` 0.289 → escala | acierta, sin confianza |
| `manos-abiertas-acogida` | `alojamiento` 0.214, `pt` 0.163 → escala | offline no llega |

El patrón es claro y era previsible desde el diseño del scorer: el offline rinde
cuando el estado es dato estructurado y denso en términos (metadatos de un
repo), y se queda plano ante lenguaje humano parafraseado, sobre todo en otro
idioma. En el caso de acogida el mensaje está en portugués y no comparte una
sola palabra con los criterios; el motor acertó el recurso pero con 0.214, así
que escaló. Ese es el comportamiento correcto, no un fallo: prefiere decir "no
sé" a inventar. Pero confirma que `manos-abiertas-acogida` y `lingua-aberta-nivel`
sólo son utilizables de verdad con el checkpoint multilingüe de Laya.
