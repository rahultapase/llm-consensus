// Council preset definitions
// Each preset defines a set of council models and a chairman model.

export type Preset = "fast" | "reasoning";

export interface PresetConfig {
  label: string;
  description: string;
  /** Full ordered list of models available in this preset (shown in config dialog). */
  councilModels: string[];
  /** Subset of councilModels that are toggled ON by default. */
  defaultEnabledModels: string[];
  chairmanModel: string;
}

export const PRESETS: Record<Preset, PresetConfig> = {
  fast: {
    label: "Fast",
    description: "Snappy models optimized for speed",
    councilModels: [
      "openai/gpt-5.4-nano",
      "google/gemini-3.1-flash-lite-preview",
      "x-ai/grok-4.1-fast",
      "mistralai/mistral-small-2603",
      "deepseek/deepseek-chat",
      "qwen/qwen-turbo",
      "moonshotai/kimi-k2.5",
      "z-ai/glm-4.7-flash",
      "minimax/minimax-m2.7",
      "bytedance-seed/seed-1.6-flash",
      "xiaomi/mimo-v2-flash",
    ],
    defaultEnabledModels: [
      "openai/gpt-5.4-nano",
      "google/gemini-3.1-flash-lite-preview",
      "x-ai/grok-4.1-fast",
      "mistralai/mistral-small-2603",
    ],
    chairmanModel: "x-ai/grok-4.1-fast",
  },
  reasoning: {
    label: "Reasoning",
    description: "Frontier models for complex problems",
    councilModels: [
      "openai/gpt-4.1-mini",
      "google/gemini-2.5-flash-lite",
      "x-ai/grok-4.1-fast",
      "moonshotai/kimi-k2-thinking",
      "deepseek/deepseek-v3.2",
      "xiaomi/mimo-v2-flash",
      "minimax/minimax-m1",
      "qwen/qwen3.5-plus-02-15",
    ],
    defaultEnabledModels: [
      "openai/gpt-4.1-mini",
      "google/gemini-2.5-flash-lite",
      "x-ai/grok-4.1-fast",
      "moonshotai/kimi-k2-thinking",
    ],
    chairmanModel: "x-ai/grok-4.1-fast",
  },
};
