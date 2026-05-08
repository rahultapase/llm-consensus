"use client";

import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { ArrowUp, Square, Settings, Zap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceInput } from "./voice-input";
import { useChatStore } from "@/lib/stores/chat";
import { ModeConfigDialog } from "@/components/council/mode-config-dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { SHORTCUT_LABELS } from "@/lib/shortcut-labels";

export interface MessageInputHandle {
  setValue: (value: string) => void;
}

interface MessageInputProps {
  onSend: (content: string) => void;
  onAbort: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(function MessageInput({
  onSend,
  onAbort,
  isStreaming,
  disabled = false,
  placeholder = "Ask anything…",
}: MessageInputProps, ref) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { councilMode, setCouncilMode } = useChatStore();

  useImperativeHandle(ref, () => ({
    setValue: (v: string) => {
      setValue(v);
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
  }));
  const [configMode, setConfigMode] = useState<"fast" | "reasoning" | null>(null);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  // Focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  const modes = [
    { key: "fast" as const, label: "Fast", icon: Zap },
    { key: "reasoning" as const, label: "Reasoning", icon: Brain },
  ];

  return (
    <div className="shrink-0 px-4 pt-3 pb-2">
      <div className="mx-auto max-w-3xl">
        <div
          className={cn(
            "relative flex flex-col rounded-2xl border transition-all duration-200"
          )}
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-input-bg)",
          }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "min-h-13 flex-1 resize-none bg-transparent px-4 pt-3.5 pb-2",
              "text-sm leading-relaxed placeholder:text-muted-foreground/40",
              "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              "max-h-50"
            )}
            style={{
              color: "var(--color-text-primary)",
              caretColor: "var(--color-text-primary)",
            }}
          />

          {/* Divider */}
          <div
            className="mx-3 h-px transition-opacity duration-200"
            style={{
              background: "var(--color-border)",
              opacity: isFocused || value ? 0.8 : 0.4,
            }}
          />

          {/* Bottom toolbar: mode pills (left) + actions (right) */}
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center gap-1.5">
              {modes.map(({ key, label, icon: Icon }) => {
                const isSelected = councilMode === key;
                return (
                  <div
                    key={key}
                    className="flex items-center gap-0.5 rounded-full border px-0.5 py-0.5 transition-all duration-150"
                    style={{
                      background: isSelected
                        ? "var(--color-btn-primary-bg)"
                        : "transparent",
                      borderColor: isSelected
                        ? "var(--color-btn-primary-bg)"
                        : "var(--color-border)",
                    }}
                  >
                    <Tooltip label={`Switch to ${label} mode`} side="bottom" disabled={isSelected}>
                      <button
                        type="button"
                        onClick={() => setCouncilMode(key)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
                          "transition-all duration-150",
                          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        )}
                        style={{
                          color: isSelected
                            ? "var(--color-btn-primary-fg)"
                            : "var(--color-text-secondary)",
                        }}
                        aria-label={`Switch to ${label} mode`}
                        aria-pressed={isSelected}
                      >
                        <Icon className="size-3" />
                        <span>{label}</span>
                      </button>
                    </Tooltip>

                    <Tooltip
                      label={`Configure ${label} models`}
                      shortcut={SHORTCUT_LABELS.switchModel}
                      side="bottom"
                      disabled={!isSelected}
                    >
                      <button
                        type="button"
                        onClick={() => setConfigMode(key)}
                        aria-label={`Configure ${label} models`}
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full transition-opacity duration-150",
                          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          isSelected ? "opacity-70 hover:opacity-100" : "opacity-55 hover:opacity-85"
                        )}
                        style={{
                          color: isSelected
                            ? "var(--color-btn-primary-fg)"
                            : "var(--color-text-secondary)",
                        }}
                      >
                        <Settings className="size-3" />
                      </button>
                    </Tooltip>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Shift+Enter hint — visible when focused with no text */}
              {isFocused && !value && (
                <span
                  className="hidden select-none text-[11px] sm:block"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  ⇧↵ new line
                </span>
              )}

              <VoiceInput
                onTranscript={(text) =>
                  setValue((prev) => (prev ? prev + " " + text : text))
                }
                disabled={isStreaming || disabled}
              />

              {isStreaming ? (
                <Tooltip label="Stop generating">
                  <button
                    onClick={onAbort}
                    aria-label="Stop generating"
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full",
                      "transition-all duration-150 hover:scale-105 active:scale-95",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    )}
                    style={{
                      background: "var(--color-btn-primary-bg)",
                      color: "var(--color-btn-primary-fg)",
                    }}
                  >
                    <Square className="size-3.5 fill-current" />
                  </button>
                </Tooltip>
              ) : (
                <Tooltip label="Send message" shortcut={canSend ? SHORTCUT_LABELS.sendMessage : undefined}>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSend}
                    aria-label="Send message"
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full",
                      "transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      canSend
                        ? "hover:scale-105 active:scale-95"
                        : "opacity-30 pointer-events-none"
                    )}
                    style={{
                      background: "var(--color-btn-primary-bg)",
                      color: "var(--color-btn-primary-fg)",
                    }}
                  >
                    <ArrowUp className="size-4" />
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        <p
          className="mt-1.5 hidden text-center text-[11px] sm:block"
          style={{ color: "var(--color-text-secondary)" }}
        >
          LLM Consensus is AI and can make mistakes.{" "}
          <span className="cursor-default">
            Please double-check responses.
          </span>
        </p>
      </div>

      {configMode && (
        <ModeConfigDialog
          open={!!configMode}
          onOpenChange={(open) => {
            if (!open) setConfigMode(null);
          }}
          mode={configMode}
        />
      )}
    </div>
  );
});
