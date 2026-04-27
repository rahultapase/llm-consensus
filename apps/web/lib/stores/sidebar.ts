import { create } from "zustand";

const STORAGE_KEY = "sidebar-open";

function readPersistedState(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

function persistState(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // ignore
  }
}

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  hydrate: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  toggle: () =>
    set((state) => {
      const next = !state.isOpen;
      persistState(next);
      return { isOpen: next };
    }),
  open: () => {
    persistState(true);
    set({ isOpen: true });
  },
  close: () => {
    persistState(false);
    set({ isOpen: false });
  },
  hydrate: () => set({ isOpen: readPersistedState() }),
}));
