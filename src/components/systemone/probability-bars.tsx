"use client";

import { cn } from "@/lib/utils";

interface ProbabilityBarsProps {
  probabilities: Record<string, number>;
  /** etiqueta legible opcional por clave (p.ej. leyenda de un Score) */
  legend?: Record<string, string>;
  /** opción ganadora (para resaltar) */
  winner?: string;
  /** si true, muestra los porcentajes numéricos */
  showValues?: boolean;
  className?: string;
}

/**
 * ProbabilityBars — barras horizontales normalizadas para visualizar la
 * distribución de probabilidad sobre las opciones de una decisión.
 */
export function ProbabilityBars({
  probabilities,
  legend,
  winner,
  showValues = true,
  className,
}: ProbabilityBarsProps) {
  const entries = Object.entries(probabilities).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className={cn("space-y-2", className)}>
      {entries.map(([key, prob]) => {
        const pct = Math.round(prob * 100);
        const isWinner = winner === key;
        const label = legend?.[key] ?? key;
        return (
          <div key={key} className="group">
            <div className="flex items-center justify-between gap-3 text-xs mb-1">
              <div className="flex items-center gap-2 min-w-0">
                {isWinner && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "font-mono truncate",
                    isWinner ? "text-foreground font-semibold" : "text-muted-foreground",
                  )}
                  title={label}
                >
                  {label}
                </span>
              </div>
              {showValues && (
                <span
                  className={cn(
                    "font-mono tabular-nums shrink-0",
                    isWinner ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {pct}%
                </span>
              )}
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isWinner ? "bg-emerald-500" : "bg-foreground/40",
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
