"use client";

import * as React from "react";
import { Tooltip as RadixTooltip } from "radix-ui";

export interface TooltipProps {
  /** Main label shown bold */
  label: string;
  /** Array of key strings, each rendered as an individual <kbd> chip */
  shortcut?: string[];
  /** Optional secondary description line (muted, smaller) */
  description?: string;
  /** Preferred side to render the tooltip */
  side?: "top" | "bottom" | "left" | "right";
  /** When true, renders children with no tooltip — useful for conditionally suppressing */
  disabled?: boolean;
  children: React.ReactNode;
}

function KeyChip({ k }: { k: string }) {
  return (
    <kbd
      className="inline-flex items-center justify-center min-w-5 h-4.5 px-1.5 rounded text-[10px] font-mono font-medium leading-none select-none"
      style={{
        background: "rgba(255,255,255,0.15)",
        border: "1px solid rgba(255,255,255,0.22)",
        color: "rgba(255,255,255,0.9)",
        boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.3)",
      }}
    >
      {k}
    </kbd>
  );
}

/**
 * Accessible tooltip with optional keyboard shortcut display.
 *
 * Always uses a dark surface (zinc-800) regardless of app theme.
 * Open delay: 400ms. Close delay: 0ms (instant).
 *
 * Radix Tooltip automatically sets role="tooltip" and aria-describedby
 * on the trigger element for full accessibility compliance.
 */
export function Tooltip({
  label,
  shortcut,
  description,
  side = "top",
  disabled = false,
  children,
}: TooltipProps) {
  if (disabled) return <>{children}</>;

  return (
    <RadixTooltip.Provider delayDuration={400} skipDelayDuration={300}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={8}
            className="z-350 rounded-lg px-3 py-2.5 text-xs shadow-2xl select-none w-max"
            style={{ background: "#27272a", color: "white" }}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white leading-none whitespace-nowrap">{label}</span>
                {shortcut && shortcut.length > 0 && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    {shortcut.map((key, i) => (
                      <KeyChip key={i} k={key} />
                    ))}
                  </div>
                )}
              </div>
              {description && (
                <span
                  className="text-[10px] leading-snug mt-0.5 max-w-52 whitespace-normal"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {description}
                </span>
              )}
            </div>
            <RadixTooltip.Arrow style={{ fill: "#27272a" }} />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
