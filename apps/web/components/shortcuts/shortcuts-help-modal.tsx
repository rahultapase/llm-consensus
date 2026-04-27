"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useUIStore } from "@/lib/stores/ui";
import { IS_MAC } from "@/lib/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/utils";

const CTRL = IS_MAC ? "⌘" : "Ctrl";
const ALT = IS_MAC ? "⌥" : "Alt";
const SHIFT = "⇧";

type ShortcutEntry = { label: string; keys: string[] };

const SECTIONS: { title: string; shortcuts: ShortcutEntry[] }[] = [
  {
    title: "Navigation",
    shortcuts: [
      { label: "Open command palette", keys: [CTRL, "K"] },
      { label: "Toggle sidebar", keys: [CTRL, "B"] },
      { label: "New chat", keys: [CTRL, SHIFT, "O"] },
      { label: "Previous conversation", keys: [CTRL, ALT, "↑"] },
      { label: "Next conversation", keys: [CTRL, ALT, "↓"] },
    ],
  },
  {
    title: "Chat",
    shortcuts: [
      { label: "Send message", keys: ["Enter"] },
      { label: "New line", keys: [SHIFT, "Enter"] },
      { label: "Open model picker", keys: [CTRL, "/"] },
      { label: "Toggle temporary chat", keys: [CTRL, SHIFT, "I"] },
      { label: "Delete current chat", keys: [CTRL, SHIFT, "⌫"] },
    ],
  },
  {
    title: "Rename (inline)",
    shortcuts: [
      { label: "Confirm rename", keys: ["Enter"] },
      { label: "Cancel rename", keys: ["Esc"] },
    ],
  },
  {
    title: "Help",
    shortcuts: [
      { label: "Show this panel", keys: [SHIFT, "?"] },
      { label: "Close", keys: ["Esc"] },
    ],
  },
];

function KeyBadge({ children }: { children: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center",
        "min-w-5.5 h-5.5 px-1.5",
        "rounded-md font-mono text-[11px] font-medium leading-none",
        "border border-white/20 bg-white/10 text-white/85",
        "shadow-[inset_0_-1px_0_rgba(0,0,0,0.35)]",
        "select-none"
      )}
    >
      {children}
    </kbd>
  );
}

export function ShortcutsHelpModal() {
  const { shortcutsHelpOpen, setShortcutsHelpOpen } = useUIStore();

  return (
    <Dialog open={shortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="sm:max-w-2xl p-0 overflow-hidden gap-0"
        style={{
          background: "hsl(220 14% 10%)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "white",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <DialogTitle className="text-sm font-semibold tracking-wide text-white/90">
            Keyboard shortcuts
          </DialogTitle>
          <button
            onClick={() => setShortcutsHelpOpen(false)}
            className={cn(
              "rounded p-1 text-white/40 transition-colors",
              "hover:text-white/80 hover:bg-white/10",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
            )}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Two-column grid */}
        <div
          className="grid grid-cols-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          {SECTIONS.map((section, si) => (
            <div
              key={si}
              className="px-6 py-5 space-y-2.5"
              style={{
                borderRight:
                  si % 2 === 0 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                borderBottom:
                  si < 2 ? "1px solid rgba(255,255,255,0.06)" : undefined,
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 pb-1">
                {section.title}
              </p>
              {section.shortcuts.map((sc, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-white/55">{sc.label}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {sc.keys.map((k, ki) => (
                      <KeyBadge key={ki}>{k}</KeyBadge>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
