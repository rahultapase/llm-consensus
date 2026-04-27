"use client";

import { useMemo } from "react";
import Markdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";
import { MermaidDiagram } from "./mermaid-diagram";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const remarkPlugins = useMemo(() => [remarkMath, remarkGfm], []);
  const rehypePlugins = useMemo(() => [rehypeKatex], []);

  return (
    <div className={cn("markdown-body text-sm leading-relaxed text-foreground/80", className)}>
      <Markdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="mb-3 mt-5 text-lg font-semibold text-foreground first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-base font-semibold text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-3 text-sm font-semibold text-foreground first:mt-0">
              {children}
            </h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-border/50 pl-4 text-muted-foreground italic">
              {children}
            </blockquote>
          ),
          // Horizontal rule
          hr: () => <hr className="my-4 border-border/30" />,
          // Strong / em
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-foreground/70 transition-colors"
            >
              {children}
            </a>
          ),
          // Tables
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border/40 bg-muted/50 px-3 py-2 text-left text-xs font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border/40 px-3 py-2 text-xs text-foreground/70">
              {children}
            </td>
          ),
          // Code
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? "");
            const lang = match?.[1] ?? "";
            const codeString = String(children).replace(/\n$/, "");

            // Mermaid diagram
            if (lang === "mermaid") {
              return <MermaidDiagram chart={codeString} />;
            }

            // Fenced code block (has a language class)
            if (match) {
              return <CodeBlock code={codeString} lang={lang} />;
            }

            // Inline code
            return (
              <code
                className="rounded bg-muted/60 px-1 py-0.5 font-mono text-xs text-foreground"
                {...props}
              >
                {children}
              </code>
            );
          },
          // Pre — wraps fenced blocks; our CodeBlock handles its own container
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
