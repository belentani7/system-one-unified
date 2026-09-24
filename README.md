# System One — Unified

> Motor de decisiones tipado, determinista y offline (`POST /v1/systemone`), unificado con la capa visual/narrativa Judas/Omega. La API es el producto reutilizable; la interfaz web es opcional.

Recibe un `state` y preguntas cerradas (`choice`, `score`, `noul`) y devuelve únicamente respuestas dentro del esquema recibido, con probabilidades, confianza, latencia y escalación.

## Modos de backend

| Backend | Descripción |
|---------|-------------|
| `offline` (default) | Determinista, sin red ni claves. Reproducible y auditable. |
| `laya` | Laya (Apache-2.0) sobre ModernBERT-large, mismo contrato `/v1/systemone`. |
| `openai-compatible` | Cualquier endpoint compatible con OpenAI `/chat/completions`. |

Si un backend externo falla, la petición cae al offline y la respuesta lo declara en el campo `backend`.

## Inicio rápido

```bash
cp .env.example .env
npm ci
npx prisma generate
npx prisma db push
npm run build
npm run start:portable   # http://localhost:3000
```

Endpoint de integración:

```bash
curl -s http://localhost:3000/v1/systemone \
  -H 'content-type: application/json' \
  -d '{"state":"...","model":"offline-local","questions":{...}}'
```

Comprobación rápida: `npm run smoke`.

## Docker

```bash
docker build -t system-one-local .
docker run --rm -p 3000:3000 --env-file .env system-one-local
```

## Scripts

`dev` · `build` · `start` · `lint` · `smoke` · `db:push` · `db:generate` · `db:migrate` · `db:reset`

## Límites honestos

La confianza matemática no equivale a exactitud real; hay que calibrarla con casos etiquetados del dominio. El modo offline es una base portable y determinista, no un reemplazo de un modelo entrenado con RLCD. No es consciente ni contiene un modelo universal de realidad.

## Licencia

[MIT](LICENSE) © 2026 Pedro Belentani
