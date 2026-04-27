"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PresetSelector } from "./preset-selector";
import { PRESETS, ALL_MODELS, type Preset } from "./presets";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { useChatStore } from "@/lib/stores/chat";

interface ModelPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (config: {
    preset: Preset;
    councilModels: string[];
    chairmanModel: string;
  }) => void;
}

export function ModelPicker({ open, onOpenChange, onConfirm }: ModelPickerProps) {
  const { lastPreset, setLastPreset } = usePreferencesStore();
  const { preset: storePreset, councilModels: storeModels, chairmanModel: storeChairman } = useChatStore();

  const [selectedPreset, setSelectedPreset] = useState<Preset>(
    (storePreset as Preset) || lastPreset
  );
  const [councilModels, setCouncilModels] = useState<string[]>(
    storeModels ?? PRESETS[selectedPreset].councilModels
  );
  const [chairmanModel, setChairmanModel] = useState<string>(
    storeChairman ?? PRESETS[selectedPreset].chairmanModel
  );
  const [showCustom, setShowCustom] = useState(false);

  // Sync when preset changes
  function handlePresetChange(preset: Preset) {
    setSelectedPreset(preset);
    setCouncilModels(PRESETS[preset].councilModels);
    setChairmanModel(PRESETS[preset].chairmanModel);
    setShowCustom(false);
  }

  function toggleModel(model: string) {
    setCouncilModels((prev) => {
      if (prev.includes(model)) {
        // Don't deselect below 2 models
        if (prev.length <= 2) return prev;
        const next = prev.filter((m) => m !== model);
        // If chairman was removed, pick first remaining
        if (chairmanModel === model) {
          setChairmanModel(next[0] ?? "");
        }
        return next;
      }
      return [...prev, model];
    });
  }

  function handleConfirm() {
    setLastPreset(selectedPreset);
    onConfirm({ preset: selectedPreset, councilModels, chairmanModel });
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-border/60 bg-background shadow-lg",
            "focus-visible:outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
            <div>
              <Dialog.Title className="text-sm font-semibold text-foreground">
                Council Configuration
              </Dialog.Title>
              <Dialog.Description className="text-[11px] text-muted-foreground/50 mt-0.5">
                Choose models for this conversation
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-md p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-5 p-5">
            {/* Presets */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/40">
                Preset
              </label>
              <PresetSelector
                value={selectedPreset}
                onChange={handlePresetChange}
              />
            </div>

            {/* Custom model toggle */}
            <button
              onClick={() => setShowCustom((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  showCustom && "rotate-180"
                )}
              />
              Customize models
            </button>

            {showCustom && (
              <div className="flex flex-col gap-4">
                {/* Council models */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/40">
                    Council Models
                    <span className="ml-2 font-normal normal-case text-muted-foreground/30">
                      ({councilModels.length} selected, min 2)
                    </span>
                  </label>
                  <div className="rounded-lg border border-border/40 divide-y divide-border/30 max-h-48 overflow-y-auto">
                    {ALL_MODELS.map((model) => {
                      const isChecked = councilModels.includes(model);
                      return (
                        <button
                          key={model}
                          onClick={() => toggleModel(model)}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                            "hover:bg-secondary/50",
                            isChecked
                              ? "text-foreground"
                              : "text-muted-foreground/50"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                              isChecked
                                ? "border-foreground/50 bg-foreground/10"
                                : "border-border/40"
                            )}
                          >
                            {isChecked && (
                              <Check className="size-2.5 text-foreground" />
                            )}
                          </span>
                          <span className="font-mono text-xs">
                            {model}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chairman model */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/40">
                    Chairman Model
                  </label>
                  <div className="rounded-lg border border-border/40 divide-y divide-border/30 max-h-36 overflow-y-auto">
                    {councilModels.map((model) => {
                      const isActive = chairmanModel === model;
                      return (
                        <button
                          key={model}
                          onClick={() => setChairmanModel(model)}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                            "hover:bg-secondary/50",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground/50"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                              isActive
                                ? "border-foreground/50 bg-foreground/10"
                                : "border-border/40"
                            )}
                          >
                            {isActive && (
                              <span className="size-2 rounded-full bg-foreground" />
                            )}
                          </span>
                          <span className="font-mono text-xs">{model}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/40 px-5 py-4">
            <div className="text-[11px] text-muted-foreground/40">
              {councilModels.length} council · 1 chairman
            </div>
            <div className="flex gap-2">
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button size="sm" onClick={handleConfirm}>
                Start conversation
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
