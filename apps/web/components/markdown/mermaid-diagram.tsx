"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

let mermaidId = 0;

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const idRef = useRef(`mermaid-${++mermaidId}`);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          fontFamily: "inherit",
        });

        const { svg } = await mermaid.render(idRef.current, chart);

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setRendered(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Diagram error");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
        <p className="font-mono text-xs text-destructive/70">
          Diagram error: {error}
        </p>
        <pre className="mt-2 font-mono text-xs text-muted-foreground/50 whitespace-pre-wrap">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "my-4 flex justify-center overflow-x-auto rounded-lg border border-border/30 bg-muted/20 p-4",
        !rendered && "min-h-16 animate-pulse",
        className
      )}
      ref={containerRef}
    />
  );
}
