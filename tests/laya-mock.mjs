/**
 * Servidor Laya falso para verificar la integracion sin descargar 800 MB.
 * Devuelve EXACTAMENTE la forma documentada en el README de convaiinnovations/laya:
 *   choice -> { choice, confidence, probabilities: { label: p } }
 *   score  -> { score, confidence, probabilities: { "0": p, "1": p, ... } }
 *   noul   -> { noul, confidence }
 * Los numeros son fijos y deliberadamente distintos de lo que produciria el
 * scorer offline, para que la prueba distinga de verdad quien decidio.
 */
import { createServer } from "node:http";

const FIXTURE = {
  answers: {
    team: {
      choice: "billing",
      confidence: 0.94,
      probabilities: { billing: 0.94, technical: 0.04, account: 0.02 },
    },
    urgent: { noul: 0.892, confidence: 0.89 },
    frustration: {
      score: 1.18,
      confidence: 0.58,
      probabilities: { "0": 0.12, "1": 0.58, "2": 0.30 },
    },
  },
  routing: { model: "english", repo: "convaiinnovations/laya", reason: "mock fixture" },
};

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    if (req.method !== "POST" || !req.url.startsWith("/v1/systemone")) {
      res.writeHead(404).end();
      return;
    }
    const received = JSON.parse(body || "{}");
    console.error("[laya-mock] questions:", Object.keys(received.questions ?? {}).join(","));
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(FIXTURE));
  });
});

server.listen(8000, "127.0.0.1", () => console.error("[laya-mock] listening on :8000"));
