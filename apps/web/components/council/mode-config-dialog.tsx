"use client";

import { useMemo, useState } from "react";
import { Zap, Brain } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { PRESETS } from "./presets";
import { useChatStore } from "@/lib/stores/chat";
import { toast } from "sonner";

interface ModeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "fast" | "reasoning";
}

const MIN_MODELS = 2;
const MAX_MODELS = 5;

export function ModeConfigDialog({
  open,
  onOpenChange,
  mode,
}: ModeConfigDialogProps) {
  const { fastModelIds, reasoningModelIds, setFastModelIds, setReasoningModelIds } =
    useChatStore();

  const presetModels = PRESETS[mode].councilModels;
  const currentIds = mode === "fast" ? fastModelIds : reasoningModelIds;
  const dialogKey = useMemo(() => `${mode}:${currentIds.join("|")}`, [currentIds, mode]);

  if (!open) {
    return <Dialog open={open} onOpenChange={onOpenChange} />;
  }

  return (
    <ModeConfigDialogContent
      key={dialogKey}
      open={open}
      onOpenChange={onOpenChange}
      mode={mode}
      currentIds={currentIds}
      presetModels={presetModels}
      setFastModelIds={setFastModelIds}
      setReasoningModelIds={setReasoningModelIds}
    />
  );
}

interface ModeConfigDialogContentProps extends ModeConfigDialogProps {
  currentIds: string[];
  presetModels: string[];
  setFastModelIds: (modelIds: string[]) => void;
  setReasoningModelIds: (modelIds: string[]) => void;
}

function ModeConfigDialogContent({
  open,
  onOpenChange,
  mode,
  currentIds,
  presetModels,
  setFastModelIds,
  setReasoningModelIds,
}: ModeConfigDialogContentProps) {
  const [draft, setDraft] = useState<string[]>(currentIds);

  function toggleModel(model: string) {
    setDraft((prev) => {
      if (prev.includes(model)) {
        if (prev.length <= MIN_MODELS) return prev;
        return prev.filter((m) => m !== model);
      }
      if (prev.length >= MAX_MODELS) return prev;
      return [...prev, model];
    });
  }

  function handleSave() {
    if (mode === "fast") {
      setFastModelIds(draft);
      toast.success("Fast models saved");
    } else {
      setReasoningModelIds(draft);
      toast.success("Reasoning models saved");
    }
    onOpenChange(false);
  }

  const ModeIcon = mode === "fast" ? Zap : Brain;
  const title = mode === "fast" ? "Fast models" : "Reasoning models";
  const count = draft.length;
  const atMax = count >= MAX_MODELS;
  const atMin = count <= MIN_MODELS;

  // Sort: enabled models first, then disabled
  const sorted = [...presetModels].sort((a, b) => {
    const aOn = draft.includes(a) ? 0 : 1;
    const bOn = draft.includes(b) ? 0 : 1;
    return aOn - bOn;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 overflow-hidden gap-0" showCloseButton={false} aria-describedby={undefined}>

        {/* Header */}
        <div
          className="flex items-start gap-3 px-5 pt-5 pb-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "var(--color-btn-primary-bg)",
              color: "var(--color-btn-primary-fg)",
            }}
          >
            <ModeIcon className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-sm font-semibold leading-tight" style={{ color: "var(--color-text-primary)" }}>
                {title}
              </DialogTitle>
              {/* Count badge */}
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
                style={{
                  background: atMax
                    ? "var(--color-btn-primary-bg)"
                    : "var(--color-sidebar-accent, var(--color-border))",
                  color: atMax
                    ? "var(--color-btn-primary-fg)"
                    : "var(--color-text-secondary)",
                }}
              >
                {count} / {MAX_MODELS}
              </span>
            </div>
            <p
              className="mt-0.5 text-xs leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Select between {MIN_MODELS} and {MAX_MODELS} models for the council.
            </p>
          </div>
        </div>

        {/* Model list */}
        <div
          className="flex flex-col overflow-y-auto"
          style={{
            maxHeight: "17rem",
            scrollbarWidth: "thin",
            scrollbarColor: "var(--color-border) transparent",
          }}
        >
          {sorted.map((model, idx) => {
            const enabled = draft.includes(model);
            const isDisabledByMin = enabled && atMin;
            const isDisabledByMax = !enabled && atMax;
            const isDisabled = isDisabledByMin || isDisabledByMax;
            const displayName = model.split("/").pop() ?? model;
            const showDivider =
              idx > 0 &&
              !draft.includes(sorted[idx]) &&
              draft.includes(sorted[idx - 1]);

            return (
              <div key={model}>
                {showDivider && (
                  <div
                    className="mx-5 my-1 flex items-center gap-2"
                    aria-hidden
                  >
                    <div
                      className="h-px flex-1"
                      style={{ background: "var(--color-border)" }}
                    />
                    <span
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}
                    >
                      Available
                    </span>
                    <div
                      className="h-px flex-1"
                      style={{ background: "var(--color-border)" }}
                    />
                  </div>
                )}
                <label
                  className="group flex items-center justify-between gap-3 px-5 py-2.5 transition-colors duration-100"
                  style={{
                    cursor: isDisabled ? "not-allowed" : "pointer",
                    background: enabled
                      ? "var(--color-sidebar-accent, transparent)"
                      : "transparent",
                    opacity: isDisabled ? 0.45 : 1,
                  }}
                  title={
                    isDisabledByMin
                      ? `Minimum ${MIN_MODELS} models required`
                      : isDisabledByMax
                      ? `Maximum ${MAX_MODELS} models reached`
                      : undefined
                  }
                >
                  <span
                    className="flex-1 truncate text-sm font-mono"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {displayName}
                  </span>
                  <Switch
                    checked={enabled}
                    disabled={isDisabled}
                    onCheckedChange={() => !isDisabled && toggleModel(model)}
                    aria-label={`${enabled ? "Disable" : "Enable"} ${displayName}`}
                  />
                </label>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <DialogFooter
          className="flex items-center justify-between gap-2 px-5 py-4"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          {/* Min/max constraint hint */}
          <span
            className="text-xs"
            style={{
              color: atMax || atMin ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              opacity: atMax || atMin ? 0.8 : 0.5,
            }}
          >
            {atMax ? "Max reached" : atMin ? "Min reached" : `${MIN_MODELS}–${MAX_MODELS} required`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="text-xs"
            >
              Save changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
