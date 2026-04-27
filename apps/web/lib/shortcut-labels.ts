"use client";

import { IS_MAC } from "@/lib/hooks/use-keyboard-shortcuts";

const CTRL = IS_MAC ? "⌘" : "Ctrl";
const SHIFT = "⇧";

/**
 * Single source of truth for keyboard shortcut display strings.
 * Used by both tooltips and the shortcuts-help modal.
 * Each value is an array of key chips rendered as individual <kbd> elements.
 *
 * CTRL resolves to "⌘" on Mac and "Ctrl" on Windows/Linux at module load time.
 */
export const SHORTCUT_LABELS: Record<string, string[]> = {
  toggleSidebar: [CTRL, "B"],
  newChat: [CTRL, SHIFT, "O"],
  search: [CTRL, "K"],
  sendMessage: ["↵"],
  temporaryChat: [CTRL, SHIFT, "I"],
  switchModel: [CTRL, "/"],
  deleteChat: [CTRL, SHIFT, "⌫"],
};
