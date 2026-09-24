"use client";

import { Ticket, Shield, Route, Receipt, FileJson } from "lucide-react";
import type { Preset } from "@/lib/systemone";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ticket: Ticket,
  shield: Shield,
  route: Route,
  receipt: Receipt,
};

interface PresetCardProps {
  preset: Preset;
  active: boolean;
  onSelect: () => void;
}

/**
 * PresetCard — tarjeta para seleccionar uno de los ejemplos predefinidos.
 */
export function PresetCard({ preset, active, onSelect }: PresetCardProps) {
  const Icon = ICONS[preset.icon] ?? FileJson;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group text-left w-full rounded-lg border p-3 transition-all",
        "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-foreground/30 bg-accent/60 ring-1 ring-foreground/10"
          : "border-border bg-card/40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={cn(
            "shrink-0 w-8 h-8 rounded-md grid place-items-center",
            "bg-foreground/5 text-foreground/70 group-hover:bg-foreground/10",
            active && "bg-foreground/10 text-foreground",
          )}
        >
          <Icon className="w-4 h-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium leading-tight text-foreground">
            {preset.title}
          </h3>
          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
            {preset.summary}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 mt-2.5">
        {preset.tags.map((t) => (
          <Badge
            key={t}
            variant="secondary"
            className="text-[9px] font-mono py-0 px-1.5 h-4"
          >
            {t}
          </Badge>
        ))}
      </div>
    </button>
  );
}
