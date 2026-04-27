import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Preset } from "@/components/council/presets";

interface PreferencesState {
  lastPreset: Preset;
  theme: "light" | "dark";
  setLastPreset: (preset: Preset) => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      lastPreset: "fast",
      theme: "light",
      setLastPreset: (preset) => set({ lastPreset: preset }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "llm-consensus-preferences",
      version: 1,
      migrate: (persisted: unknown) => {
        const state = persisted as Record<string, unknown>;
        if (state.lastPreset !== "fast" && state.lastPreset !== "reasoning") {
          state.lastPreset = "fast";
        }
        return state as unknown as PreferencesState;
      },
    }
  )
);
