"use client";

import { AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EscalationBadgeProps {
  requiresEscalation: boolean;
  count?: number;
  className?: string;
}

/**
 * EscalationBadge — badge que indica si la decisión requirió escalación
 * a humano / LLM razonador porque el confidence cayó por debajo del umbral.
 */
export function EscalationBadge({
  requiresEscalation,
  count = 0,
  className,
}: EscalationBadgeProps) {
  if (!requiresEscalation) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          className,
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden />
        No escalado
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
        className,
      )}
    >
      <AlertTriangle className="w-3.5 h-3.5" aria-hidden />
      Escalado
      {count > 0 && (
        <span className="ml-0.5 inline-flex items-center gap-0.5">
          <ArrowUpRight className="w-3 h-3" aria-hidden />
          {count}
        </span>
      )}
    </span>
  );
}
