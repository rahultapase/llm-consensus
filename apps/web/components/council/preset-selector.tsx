"use client";

import { cn } from "@/lib/utils";
import { PRESETS, type Preset } from "./presets";

interface PresetSelectorProps {
  value: Preset;
  onChange: (preset: Preset) => void;
  className?: string;
}

const PRESET_KEYS: Preset[] = ["fast", "reasoning"];

export function PresetSelector({
  value,
  onChange,
  className,
}: PresetSelectorProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {PRESET_KEYS.map((key) => {
        const preset = PRESETS[key];
        const isActive = value === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              "flex flex-col items-start rounded-lg border px-4 py-3 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "border-foreground/30 bg-foreground/5 text-foreground"
                : "border-border/40 text-muted-foreground hover:border-border hover:text-foreground/70"
            )}
          >
            <span className="text-sm font-medium">{preset.label}</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground/60">
              {preset.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
