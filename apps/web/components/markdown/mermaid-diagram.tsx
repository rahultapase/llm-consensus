"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

let mermaidId = 0;

const FLOWCHART_START_RE = /^(?:flowchart|graph)\b/m;
const SEQUENCE_START_RE = /^sequenceDiagram\b/m;

function normalizeMermaidSource(chart: string) {
  return chart
    .replace(/\r\n?/g, "\n")
    .replace(/^```(?:mermaid)?\s*/i, "")
    .replace(/\n```\s*$/i, "")
    .replace(/^mermaid\s*\n/i, "")
    .replace(/<br\s*\/?>/gi, "<br/>")
    .replace(/\u00a0/g, " ")
    .trim();
}

function shouldQuoteMermaidLabel(label: string) {
  const trimmed = label.trim();

  return trimmed.length > 0 && !/^["`].*["`]$/.test(trimmed) && /[()/:{}\[\],]/.test(trimmed);
}

function escapeMermaidLabel(label: string) {
  return label.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function repairFlowchartLabels(chart: string) {
  let repaired = chart.replace(/\|([^|\n]+)\|/g, (match, label: string) => {
    const trimmed = label.trim();

    if (!shouldQuoteMermaidLabel(trimmed)) {
      return match;
    }

    return `|"${escapeMermaidLabel(trimmed)}"|`;
  });

  repaired = repaired.replace(/(\b[A-Za-z][\w-]*)\[([^\]\n]+)\]/g, (match, nodeId: string, label: string) => {
    const trimmed = label.trim();

    if (!shouldQuoteMermaidLabel(trimmed)) {
      return match;
    }

    return `${nodeId}["${escapeMermaidLabel(trimmed)}"]`;
  });

  return repaired;
}

function repairSequenceArrows(chart: string) {
  return chart.replace(/([-.]+>>)\s*--(?=\s*[A-Za-z_"])/g, "$1-");
}

function stripSequenceActivationMarkers(chart: string) {
  return chart
    .replace(/([-.]+>>)\+/g, "$1")
    .replace(/([-.]+>>)\s*-(?=\s*[A-Za-z_"])/g, "$1");
}

function buildChartCandidates(chart: string) {
  const base = normalizeMermaidSource(chart);
  const candidates = [base];

  if (SEQUENCE_START_RE.test(base)) {
    candidates.push(repairSequenceArrows(base));
    candidates.push(stripSequenceActivationMarkers(repairSequenceArrows(base)));
  }

  if (FLOWCHART_START_RE.test(base)) {
    candidates.push(repairFlowchartLabels(base));
  }

  if (SEQUENCE_START_RE.test(base) || FLOWCHART_START_RE.test(base)) {
    candidates.push(repairFlowchartLabels(repairSequenceArrows(base)));
  }

  return [...new Set(candidates.filter(Boolean))];
}

async function selectRenderableChart(
  mermaid: Awaited<typeof import("mermaid")>["default"],
  chart: string
) {
  const candidates = buildChartCandidates(chart);

  for (const candidate of candidates) {
    const isValid = await mermaid.parse(candidate, { suppressErrors: true });

    if (isValid !== false) {
      return candidate;
    }
  }

  return candidates[0] ?? chart;
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);
  const idRef = useRef(`mermaid-${++mermaidId}`);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        setRendered(false);
        setError(null);

        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }

        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          fontFamily: "inherit",
          securityLevel: "strict",
          flowchart: {
            htmlLabels: false,
          },
        });

        const renderableChart = await selectRenderableChart(mermaid, chart);
        const { svg } = await mermaid.render(idRef.current, renderableChart);

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
