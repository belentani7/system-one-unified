"use client";

import { ArrowUpRight, Gauge, Sparkles } from "lucide-react";
import {
  PRIMITIVE_META,
  isChoice,
  isNoul,
  isScore,
  type Answer,
  type Question,
} from "@/lib/systemone";
import { cn } from "@/lib/utils";
import { ConfidenceMeter } from "./confidence-meter";
import { ProbabilityBars } from "./probability-bars";
import { PrimitiveIcon } from "./primitive-icon";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DecisionCardProps {
  questionKey: string;
  question: Question;
  answer: Answer;
  threshold: number;
  escalated: boolean;
}

/**
 * DecisionCard — tarjeta que muestra una pregunta y su respuesta tipada
 * con visualización de probabilidades, score y confidence.
 */
export function DecisionCard({
  questionKey,
  question,
  answer,
  threshold,
  escalated,
}: DecisionCardProps) {
  const meta = PRIMITIVE_META[question.type];

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        escalated
          ? "border-rose-500/40 ring-1 ring-rose-500/20"
          : "border-border",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <PrimitiveIcon type={question.type} withLabel />
              <code className="text-sm font-mono text-foreground/80">
                {questionKey}
              </code>
              {escalated && (
                <Badge
                  variant="outline"
                  className="text-rose-500 border-rose-500/40 gap-1 text-[10px]"
                >
                  <ArrowUpRight className="w-3 h-3" />
                  escalate
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-snug">
              {question.instructions}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ---------- CHOICE ---------- */}
        {answer.type === "choice" && isChoice(question) && (
          <ChoiceView answer={answer} question={question} />
        )}

        {/* ---------- NOUL ---------- */}
        {answer.type === "noul" && isNoul(question) && (
          <NoulView answer={answer} question={question} />
        )}

        {/* ---------- SCORE ---------- */}
        {answer.type === "score" && isScore(question) && (
          <ScoreView answer={answer} question={question} />
        )}

        {/* ---------- Confidence (no se muestra en noul) ---------- */}
        {answer.type !== "noul" && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-3.5 h-3.5 text-muted-foreground" aria-hidden />
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Confidence
              </span>
            </div>
            <ConfidenceMeter
              value={"confidence" in answer ? answer.confidence : 0}
              threshold={threshold}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------- Sub-views ---------- */

function ChoiceView({
  answer,
  question,
}: {
  answer: Extract<Answer, { type: "choice" }>;
  question: Extract<Question, { type: "choice" }>;
}) {
  // Mapa de clave -> etiqueta legible (usamos la descripción de los criteria)
  const legend: Record<string, string> = {};
  for (const [k, v] of Object.entries(question.criteria)) {
    legend[k] = `${k} · ${v}`;
  }
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Selected
        </span>
        <code className="text-lg font-mono font-semibold text-foreground">
          {answer.choice}
        </code>
        <Sparkles
          className="w-3.5 h-3.5 text-emerald-500"
          aria-hidden
        />
      </div>
      <ProbabilityBars
        probabilities={answer.probabilities}
        legend={legend}
        winner={answer.choice}
      />
    </div>
  );
}

function NoulView({
  answer,
  question,
}: {
  answer: Extract<Answer, { type: "noul" }>;
  question: Extract<Question, { type: "noul" }>;
}) {
  const pct = Math.round(answer.noul * 100);
  const yes = answer.noul >= 0.5;
  const colorClass = yes
    ? "from-emerald-500 to-emerald-400"
    : "from-zinc-400 to-zinc-300 dark:from-zinc-600 dark:to-zinc-500";

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          P(yes)
        </span>
        <span className="text-2xl font-mono font-bold tabular-nums text-foreground">
          {answer.noul.toFixed(2)}
        </span>
        <Badge
          variant={yes ? "default" : "secondary"}
          className={cn("font-mono", yes && "bg-emerald-500 text-white")}
        >
          {yes ? "TRUE" : "FALSE"}
        </Badge>
      </div>
      {/* Barra horizontal 0..1 */}
      <div className="relative">
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-r transition-all duration-500",
              colorClass,
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Marcador 0.5 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-foreground/40"
          style={{ left: "50%" }}
          title="Decision boundary (0.5)"
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>0.00 no</span>
        <span>0.50</span>
        <span>1.00 yes</span>
      </div>
      <p className="text-[11px] text-muted-foreground italic">
        Noul no lleva confidence separado: el valor ya es la certeza.
      </p>
    </div>
  );
}

function ScoreView({
  answer,
  question,
}: {
  answer: Extract<Answer, { type: "score" }>;
  question: Extract<Question, { type: "score" }>;
}) {
  const max = question.criteria.length - 1;
  const pct = max > 0 ? (answer.score / max) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Weighted score
        </span>
        <span className="text-2xl font-mono font-bold tabular-nums text-foreground">
          {answer.score.toFixed(2)}
        </span>
        <span className="text-xs font-mono text-muted-foreground">
          / {max}
        </span>
      </div>
      {/* Barra continua */}
      <div className="relative">
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Marcadores discretos */}
        {question.criteria.map((_, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-foreground/30"
            style={{ left: `${(i / max) * 100}%` }}
            title={`Position ${i}`}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        {question.criteria.map((label, i) => (
          <span key={i} className="truncate max-w-[30%] text-center" title={label}>
            {label}
          </span>
        ))}
      </div>
      <div className="pt-1">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground block mb-2">
          Distribution
        </span>
        <ProbabilityBars
          probabilities={answer.probabilities}
          legend={answer.legend}
          winner={String(Math.round(answer.score))}
        />
      </div>
    </div>
  );
}
