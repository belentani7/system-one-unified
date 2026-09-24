"use client";

import { Clock, Cpu, Zap, Activity } from "lucide-react";
import type { DecideResponse } from "@/lib/systemone";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { EscalationBadge } from "./escalation-badge";

interface ResultMetricsProps {
  response: DecideResponse;
  threshold: number;
  className?: string;
}

/**
 * ResultMetrics — tira de métricas de la decisión: modelo, latencia, tokens,
 * escalación. Replica el "usage + latency_ms" del contrato TypeSafe.
 */
export function ResultMetrics({
  response,
  threshold,
  className,
}: ResultMetricsProps) {
  const latency = response.latency_ms;
  // Zona Jev-like: <500ms está en rango System One
  const latencyTone =
    latency < 300
      ? "text-emerald-500"
      : latency < 800
        ? "text-amber-500"
        : "text-rose-500";

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Metric
          icon={<Cpu className="w-3.5 h-3.5" />}
          label="Model"
          value={response.model}
        />
        <Metric
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Latency"
          value={`${latency} ms`}
          valueClass={latencyTone}
        />
        <Metric
          icon={<Zap className="w-3.5 h-3.5" />}
          label="Input tokens"
          value={String(response.usage.input_tokens)}
          sub={`out: ${response.usage.output_tokens}`}
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            <Activity className="w-3.5 h-3.5" aria-hidden />
            Escalation
          </div>
          <EscalationBadge
            requiresEscalation={response.requires_escalation}
            count={response.escalated_questions.length}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-mono text-sm font-semibold tabular-nums",
            valueClass,
          )}
        >
          {value}
        </span>
        {sub && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
