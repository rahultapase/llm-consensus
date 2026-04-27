"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// ASCII table rendering
// ---------------------------------------------------------------------------

function renderAsciiTable(tableLines: string[]): string {
  const rows: string[][] = [];
  let headerCount = 0;

  for (const line of tableLines) {
    // Separator row e.g. | --- | :---: | ---: |
    if (/^\|[\s|:\-]+\|/.test(line)) {
      headerCount = rows.length;
      continue;
    }
    const cells = line
      .replace(/^\||\|\s*$/g, "")
      .split("|")
      .map((c) => c.trim());
    rows.push(cells);
  }

  if (rows.length === 0) return tableLines.join("\n");

  const colCount = Math.max(...rows.map((r) => r.length));
  const colWidths = Array.from({ length: colCount }, (_, i) =>
    Math.max(...rows.map((r) => (r[i] ?? "").length), 3)
  );

  const thin  = "+" + colWidths.map((w) => "-".repeat(w + 2)).join("+") + "+";
  const thick = "+" + colWidths.map((w) => "=".repeat(w + 2)).join("+") + "+";
  const renderRow = (row: string[]) =>
    "| " + colWidths.map((w, i) => (row[i] ?? "").padEnd(w)).join(" | ") + " |";

  const out: string[] = [thin];
  rows.forEach((row, idx) => {
    out.push(renderRow(row));
    if (headerCount > 0 && idx === headerCount - 1) out.push(thick);
  });
  out.push(thin);
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Plain-text conversion
// ---------------------------------------------------------------------------

function markdownToPlainText(md: string): string {
  // Convert markdown tables to ASCII-bordered tables first (line-aware)
  const inputLines = md.split("\n");
  const processed: string[] = [];
  let i = 0;
  while (i < inputLines.length) {
    if (/^\|.+\|/.test(inputLines[i])) {
      const block: string[] = [];
      while (i < inputLines.length && /^\|.+\|/.test(inputLines[i])) {
        block.push(inputLines[i++]);
      }
      processed.push(renderAsciiTable(block));
    } else {
      processed.push(inputLines[i++]);
    }
  }
  let t = processed.join("\n");

  // Fenced code blocks — strip fences, keep content
  t = t.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code: string) => code.trim());

  // Setext-style headings (must come before horizontal rule removal)
  t = t.replace(/^(.+)\n={3,}\s*$/gm, "$1");
  t = t.replace(/^(.+)\n-{3,}\s*$/gm, "$1");

  // ATX headings
  t = t.replace(/^#{1,6}\s+/gm, "");

  // Horizontal rules — after setext headings to avoid collision
  t = t.replace(/^(?:[-*_]\s?){3,}\s*$/gm, "");

  // Strikethrough
  t = t.replace(/~~([^~\n]+)~~/g, "$1");

  // Inline code
  t = t.replace(/`([^`]+)`/g, "$1");

  // Bold + italic — most specific first to avoid partial matches
  t = t.replace(/\*{3}([^*\n]+)\*{3}/g, "$1");
  t = t.replace(/_{3}([^_\n]+)_{3}/g, "$1");
  t = t.replace(/\*{2}([^*\n]+)\*{2}/g, "$1");
  t = t.replace(/_{2}([^_\n]+)_{2}/g, "$1");
  t = t.replace(/\*([^*\n]+)\*/g, "$1");
  t = t.replace(/_([^_\n]+)_/g, "$1");

  // Images — keep alt text
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");

  // Links → link text only
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Blockquotes
  t = t.replace(/^>\s?/gm, "");

  // Unordered list markers — strip bullet, preserve indentation
  t = t.replace(/^(\s*)[-*+]\s+/gm, "$1");

  // Ordered list markers — keep numbers (readable in plain text)
  // e.g. "1. Item" stays as "1. Item"

  // HTML <br> → newline, all other tags stripped
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<[^>]+>/g, "");

  // Common HTML entities
  t = t
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Collapse 3+ blank lines to 2
  t = t.replace(/\n{3,}/g, "\n\n");

  return t.trim();
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CopyOption = "plain" | "markdown";

interface CopyMenuButtonProps {
  text: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CopyMenuButton({ text, className }: CopyMenuButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<CopyOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Close menu on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  async function copyText(option: CopyOption) {
    const content = option === "plain" ? markdownToPlainText(text) : text;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(option);
      setOpen(false);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard API failed silently
    }
  }

  const isCopied = copied !== null;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Copy options"
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex h-7 items-center gap-0.5 rounded px-1.5",
          "text-muted-foreground/50 transition-all duration-150",
          "hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          open && "text-foreground bg-muted/40"
        )}
      >
        {isCopied ? (
          <Check className="size-3.5 text-green-500" />
        ) : (
          <Copy className="size-3.5" />
        )}
        <ChevronDown
          className={cn(
            "size-2.5 transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full z-50 mt-1 min-w-42",
            "rounded-lg border border-border/60 bg-popover py-1 shadow-md shadow-black/10",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-100"
          )}
        >
          <button
            role="menuitem"
            onClick={() => copyText("plain")}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-2",
              "text-left text-xs text-foreground/80",
              "hover:bg-muted/50 hover:text-foreground",
              "focus-visible:outline-none focus-visible:bg-muted/50",
              "transition-colors duration-100"
            )}
          >
            {copied === "plain" ? (
              <Check className="size-3.5 shrink-0 text-green-500" />
            ) : (
              <FileText className="size-3.5 shrink-0 text-muted-foreground/60" />
            )}
            <span>Copy as Plain Text</span>
          </button>

          <button
            role="menuitem"
            onClick={() => copyText("markdown")}
            className={cn(
              "flex w-full items-center gap-2.5 px-3 py-2",
              "text-left text-xs text-foreground/80",
              "hover:bg-muted/50 hover:text-foreground",
              "focus-visible:outline-none focus-visible:bg-muted/50",
              "transition-colors duration-100"
            )}
          >
            {copied === "markdown" ? (
              <Check className="size-3.5 shrink-0 text-green-500" />
            ) : (
              <Copy className="size-3.5 shrink-0 text-muted-foreground/60" />
            )}
            <span>Copy as Markdown</span>
          </button>
        </div>
      )}
    </div>
  );
}
