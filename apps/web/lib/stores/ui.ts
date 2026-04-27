import { create } from "zustand";

interface UIState {
  commandPaletteOpen: boolean;
  shortcutsHelpOpen: boolean;
  modelPickerOpen: boolean;
  /** Conversation ID awaiting delete confirmation, or null if no dialog is open */
  deleteConfirmConversationId: string | null;

  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setShortcutsHelpOpen: (open: boolean) => void;
  setModelPickerOpen: (open: boolean) => void;
  setDeleteConfirmConversationId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  commandPaletteOpen: false,
  shortcutsHelpOpen: false,
  modelPickerOpen: false,
  deleteConfirmConversationId: null,

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setShortcutsHelpOpen: (open) => set({ shortcutsHelpOpen: open }),
  setModelPickerOpen: (open) => set({ modelPickerOpen: open }),
  setDeleteConfirmConversationId: (id) =>
    set({ deleteConfirmConversationId: id }),
}));
