"use client";

import { useState } from "react";
import { ChevronRight, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
  data: unknown;
  label?: string;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * JsonViewer — bloque colapsable que muestra el JSON crudo del contrato
 * (request o response). Útil para ver que la salida es 100% tipada.
 */
export function JsonViewer({
  data,
  label = "JSON",
  defaultOpen = false,
  className,
}: JsonViewerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const text = JSON.stringify(data, null, 2);

  return (
    <div className={cn("rounded-lg border border-border bg-card/30", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
      >
        <ChevronRight
          className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-90")}
          aria-hidden
        />
        <FileJson className="w-3.5 h-3.5" aria-hidden />
        {label}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground/70">
          {text.length} chars
        </span>
      </button>
      {open && (
        <pre className="overflow-x-auto max-h-96 px-3 pb-3 text-[11px] font-mono leading-relaxed text-foreground/80">
          <code>{text}</code>
        </pre>
      )}
    </div>
  );
}
