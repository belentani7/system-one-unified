/**
 * Presets — ejemplos listos para usar (como los examples/ del proyecto original).
 * Cubren los 3 casos canónicos de Jev: triaje de tickets, moderación y enrutado.
 */

import type { DecideInput } from "./schema";

export interface Preset {
  id: string;
  title: string;
  summary: string;
  icon: string;
  tags: string[];
  request: DecideInput;
}

export const PRESETS: Preset[] = [
  {
    id: "triage-ticket",
    title: "Triaje de tickets de soporte",
    summary:
      "Clasifica un ticket entrante por departamento, detecta si pide reembolso y mide la frustración del cliente en una sola pasada.",
    icon: "ticket",
    tags: ["support", "triage", "routing"],
    request: {
      state:
        "Llevo 3 días intentando exportar mi reporte y el sistema arroja un Error 500. ¡Es inaceptable, exijo que me devuelvan el dinero de la suscripción de este mes!",
      model: "local-latest",
      confidence_threshold: 0.6,
      questions: {
        department: {
          type: "choice",
          instructions: "Which team should handle this ticket?",
          criteria: {
            billing: "Payments, invoices, refunds, subscriptions",
            technical: "Bugs, outages, server errors",
            account: "Sign-in, access issues, profile",
          },
        },
        wants_refund: {
          type: "noul",
          instructions:
            "Is the customer explicitly requesting a money refund?",
        },
        frustration: {
          type: "score",
          instructions: "How frustrated is the customer?",
          criteria: [
            "Calm — just reporting a fact",
            "Frustrated — civil but annoyed",
            "Very angry — caps, demands, threats",
          ],
        },
      },
    },
  },
  {
    id: "content-moderation",
    title: "Moderación de contenido",
    summary:
      "Clasifica un mensaje entrante por tipo de violación, decide si es spam y mide el nivel de toxicidad.",
    icon: "shield",
    tags: ["moderation", "trust-safety", "spam"],
    request: {
      state:
        "HEY EVERYONE!! Claim your FREE 0.5 BTC now by clicking this link: bit.ly/free-btc-giveaway. Limited time offer, don't miss out!!!1",
      model: "local-latest",
      confidence_threshold: 0.65,
      questions: {
        violation_type: {
          type: "choice",
          instructions: "Which moderation category best fits this content?",
          criteria: {
            spam: "Unsolicited promotion, scams, giveaway bait",
            harassment: "Targeted abuse, insults against a person",
            violence: "Threats of physical harm",
            benign: "No policy violation",
          },
        },
        is_spam: {
          type: "noul",
          instructions: "Is this message spam or scam bait?",
        },
        toxicity: {
          type: "score",
          instructions: "How toxic is the content?",
          criteria: [
            "Safe — neutral or positive",
            "Borderline — risky but not policy-breaking",
            "Toxic — clear policy violation",
          ],
        },
      },
    },
  },
  {
    id: "agent-routing",
    title: "Enrutado de agente IA",
    summary:
      "Decide qué agente especializado debe atender la consulta del usuario y si requiere un modelo razonador.",
    icon: "route",
    tags: ["agents", "routing", "fallback"],
    request: {
      state:
        "Hola, necesito ayuda para configurar la integración de webhooks con mi ERP interno y también tengo una duda sobre la facturación de este mes. ¿Podéis echarme una mano?",
      model: "local-latest",
      confidence_threshold: 0.55,
      questions: {
        agent: {
          type: "choice",
          instructions:
            "Which specialized agent should pick up this conversation first?",
          criteria: {
            sales: "Pricing, plans, demos, commercial questions",
            support: "Setup, integrations, how-to, technical help",
            billing: "Invoices, payments, subscription changes",
            human: "Edge case — route to a human operator",
          },
        },
        needs_reasoner: {
          type: "noul",
          instructions:
            "Does this request look complex enough to warrant a slow reasoning LLM instead of a fast responder?",
        },
        urgency: {
          type: "score",
          instructions: "How urgent is this request?",
          criteria: [
            "Low — routine, no deadline",
            "Medium — slight time pressure",
            "High — blocking, needs fast response",
          ],
        },
      },
    },
  },
  {
    id: "invoice-classification",
    title: "Clasificación de facturas",
    summary:
      "Clasifica una factura por categoría contable, detecta si requiere aprobación manual y mide el riesgo fiscal.",
    icon: "receipt",
    tags: ["finance", "ops", "compliance"],
    request: {
      state:
        "Factura F-2026-0987. Proveedor: ACME Cloud Services. Concepto: infraestructura de hosting dedicado + soporte premium 24/7 para el trimestre Q4. Importe: 18.450€. Forma de pago: transferencia a 60 días. Sin retención aplicada.",
      model: "local-latest",
      confidence_threshold: 0.6,
      questions: {
        category: {
          type: "choice",
          instructions: "Which accounting category fits this invoice?",
          criteria: {
            infra: "Hosting, servers, cloud infrastructure",
            software: "Licenses, SaaS, subscriptions",
            consulting: "Professional services, advisory",
            hardware: "Physical equipment, devices",
          },
        },
        needs_manual_approval: {
          type: "noul",
          instructions:
            "Does this invoice need manual approval (e.g. high amount, no withholding tax, long payment terms)?",
        },
        fiscal_risk: {
          type: "score",
          instructions: "What is the fiscal/compliance risk level?",
          criteria: [
            "Low — complies with all controls",
            "Medium — minor issues to review",
            "High — multiple red flags, escalate to finance",
          ],
        },
      },
    },
  },
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
