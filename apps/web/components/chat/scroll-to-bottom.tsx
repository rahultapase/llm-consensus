"use client";

import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollToBottomProps {
  visible: boolean;
  onClick: () => void;
}

export function ScrollToBottom({ visible, onClick }: ScrollToBottomProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Scroll to bottom"
      className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 z-10",
        "flex size-8 items-center justify-center rounded-full",
        "border border-border bg-background shadow-md",
        "text-muted-foreground transition-all duration-200",
        "hover:text-foreground hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        visible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-2 opacity-0 pointer-events-none"
      )}
    >
      <ArrowDown className="size-3.5" />
    </button>
  );
}
