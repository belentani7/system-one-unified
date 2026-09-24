"use client";

import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  value: number; // 0..1
  threshold: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

/**
 * ConfidenceMeter — barra horizontal semicircular con zona verde/ámbar/roja
 * que refleja el nivel de confianza calibrado vs el umbral de escalación.
 */
export function ConfidenceMeter({
  value,
  threshold,
  size = "md",
  showLabel = true,
  className,
}: ConfidenceMeterProps) {
  const pct = Math.round(value * 100);
  const thresholdPct = Math.round(threshold * 100);
  const below = value < threshold;

  const colorClass = below
    ? "text-rose-500"
    : value < threshold + 0.15
      ? "text-amber-500"
      : "text-emerald-500";

  const barClass = below
    ? "bg-rose-500"
    : value < threshold + 0.15
      ? "bg-amber-500"
      : "bg-emerald-500";

  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Track */}
        <div
          className={cn(
            "w-full rounded-full bg-muted overflow-hidden",
            heights[size],
          )}
        >
          {/* Fill */}
          <div
            className={cn("h-full rounded-full transition-all duration-500", barClass)}
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Threshold marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-foreground/40 -ml-px"
          style={{ left: `${thresholdPct}%` }}
          title={`Threshold: ${thresholdPct}%`}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5 text-[11px] font-mono">
          <span className="text-muted-foreground">conf {pct}%</span>
          <span className="text-muted-foreground">
            threshold {thresholdPct}%
          </span>
        </div>
      )}
      <span className="sr-only">
        Confidence {pct} percent, {below ? "below" : "above"} threshold.
      </span>
      <span className={cn("sr-only", colorClass)} aria-hidden />
    </div>
  );
}
