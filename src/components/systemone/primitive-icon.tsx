"use client";

import { CheckCircle2, ListChecks, ToggleLeft } from "lucide-react";
import { PRIMITIVE_META, type PrimitiveType } from "@/lib/systemone";
import { cn } from "@/lib/utils";

const ICONS: Record<PrimitiveType, React.ComponentType<{ className?: string }>> = {
  choice: ListChecks,
  noul: ToggleLeft,
  score: CheckCircle2,
};

interface PrimitiveIconProps {
  type: PrimitiveType;
  size?: "sm" | "md";
  withLabel?: boolean;
  className?: string;
}

/**
 * PrimitiveIcon — chip identificador del tipo de primitiva (Choice/Noul/Score).
 */
export function PrimitiveIcon({
  type,
  size = "sm",
  withLabel = false,
  className,
}: PrimitiveIconProps) {
  const meta = PRIMITIVE_META[type];
  const Icon = ICONS[type];

  const colorMap: Record<string, string> = {
    emerald:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    violet:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/25",
    amber:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  };

  const sizes = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
  };

  const iconSizes = { sm: "w-3 h-3", md: "w-3.5 h-3.5" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-mono font-semibold uppercase tracking-wide",
        colorMap[meta.color],
        sizes[size],
        className,
      )}
      title={meta.description}
    >
      <Icon className={iconSizes[size]} aria-hidden />
      {withLabel && <span>{meta.label}</span>}
    </span>
  );
}
