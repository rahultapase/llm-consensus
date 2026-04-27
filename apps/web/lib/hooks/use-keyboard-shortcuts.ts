"use client";

import { useEffect } from "react";

/** True when running on macOS/iOS — evaluated once at module load time. */
export const IS_MAC =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPod|iPad/.test(navigator.platform);

export interface Shortcut {
  /**
   * The key to match, compared case-insensitively against `e.key`
   * (e.g. "k", "Escape", "ArrowUp", "/", "?", "Backspace").
   */
  key: string;
  /** Require Cmd (Mac) or Ctrl (Win/Linux). Default: false */
  ctrl?: boolean;
  /** Require Shift. Default: false */
  shift?: boolean;
  /** Require Alt / Option. Default: false */
  alt?: boolean;
  /**
   * When true, the shortcut fires even when an <input>, <textarea>, or
   * contenteditable element has focus. Use for global navigation shortcuts
   * (Ctrl+K, Ctrl+B, etc.) that should always be reachable.
   * Default: false
   */
  ignoreInputGuard?: boolean;
  handler: () => void;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el || el === document.body) return false;
  const tag = (el as HTMLElement).tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return (el as HTMLElement).isContentEditable;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      for (const s of shortcuts) {
        if (e.key.toLowerCase() !== s.key.toLowerCase()) continue;

        const ctrlRequired = s.ctrl ?? false;
        if (ctrlRequired !== (e.metaKey || e.ctrlKey)) continue;

        const shiftRequired = s.shift ?? false;
        if (shiftRequired !== e.shiftKey) continue;

        const altRequired = s.alt ?? false;
        if (altRequired !== e.altKey) continue;

        if (!s.ignoreInputGuard && isInputFocused()) continue;

        e.preventDefault();
        s.handler();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);
}
