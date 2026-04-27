/*
 * Visual direction: ChatGPT-faithful.
 * Clean neutral grays, never pure black. Generous whitespace.
 * Minimal borders. Calm and focused. Split-panel layout.
 * Both panels inherit global theme variables and adapt to light/dark.
 * No hardcoded hex values — CSS variables only.
 */

import { TRPCReactProvider } from "@/trpc/react";
import { Logo } from "@/components/logo";
import { Layers, BarChart3, Sparkles } from "lucide-react";

const steps = [
  {
    Icon: Layers,
    label: "Query",
    desc: "One prompt, every model answers in parallel",
  },
  {
    Icon: BarChart3,
    label: "Rank",
    desc: "Each model scores the others\u2019 answers anonymously",
  },
  {
    Icon: Sparkles,
    label: "Synthesize",
    desc: "A chairman distills the final consensus answer",
  },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TRPCReactProvider>
      <div className="flex min-h-svh flex-col lg:flex-row">
        {/* Left branding panel — ~45% desktop, thin bar on mobile */}
        <div
          className="relative flex shrink-0 flex-col justify-between border-b lg:border-b-0 lg:border-r lg:w-[45%]"
          style={{
            background: "var(--color-sidebar-bg)",
            borderColor: "var(--color-border)",
          }}
        >
          {/* Mobile: compact bar */}
          <div className="flex items-center gap-3 px-6 py-4 lg:hidden">
            <Logo size={20} withWordmark href="/" />
          </div>

          {/* Desktop: full panel */}
          <div className="relative hidden h-full flex-col p-12 lg:flex">
            {/* Floating gradient orbs — decorative background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {/* Orb 1 — upper teal wash */}
              <div
                className="absolute rounded-full"
                style={{
                  top: "-20%",
                  left: "-15%",
                  right: "-15%",
                  width: "130%",
                  height: "65%",
                  background:
                    "radial-gradient(ellipse at center, var(--color-accent) 0%, transparent 60%)",
                  opacity: 0.14,
                  filter: "blur(72px)",
                  animation: "float-orb 22s ease-in-out infinite",
                }}
              />
              {/* Orb 2 — mid violet bloom */}
              <div
                className="absolute rounded-full"
                style={{
                  top: "25%",
                  left: "-20%",
                  right: "-20%",
                  width: "140%",
                  height: "60%",
                  background:
                    "radial-gradient(ellipse at center, #8b5cf6 0%, transparent 58%)",
                  opacity: 0.10,
                  filter: "blur(80px)",
                  animation: "float-orb 28s ease-in-out 6s infinite",
                }}
              />
              {/* Orb 3 — lower sky wash */}
              <div
                className="absolute rounded-full"
                style={{
                  bottom: "-15%",
                  left: "-10%",
                  right: "-10%",
                  width: "120%",
                  height: "60%",
                  background:
                    "radial-gradient(ellipse at center, #0ea5e9 0%, transparent 60%)",
                  opacity: 0.11,
                  filter: "blur(68px)",
                  animation: "float-orb 25s ease-in-out 12s infinite",
                }}
              />
            </div>

            {/* Logo — top */}
            <div className="relative z-10 flex items-center gap-3">
              <Logo size={44} href="/" />
              <div>
                <p
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  LLM Consensus
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  AI consensus engine
                </p>
              </div>
            </div>

            {/* Steps — centered in remaining vertical space */}
            <div className="relative z-10 flex flex-1 flex-col justify-center">
                {steps.map(({ Icon, label, desc }, i) => (
                  <div key={label}>
                    <div
                      className="flex items-start gap-3.5 rounded-xl px-4 py-3.5"
                      style={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div
                        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background:
                            "color-mix(in srgb, var(--color-accent) 14%, transparent)",
                        }}
                      >
                        <Icon
                          className="size-4"
                          style={{ color: "var(--color-accent)" }}
                        />
                      </div>
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          {label}
                        </p>
                        <p
                          className="mt-0.5 text-xs leading-relaxed"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {desc}
                        </p>
                      </div>
                    </div>
                    {i < steps.length - 1 && (
                      <div
                        className="relative ml-8 h-5 w-0.5 overflow-hidden rounded-full"
                        style={{
                          background:
                            "color-mix(in srgb, var(--color-accent) 18%, transparent)",
                        }}
                      >
                        <div
                          className="absolute inset-x-0 h-1/2 rounded-full"
                          style={{
                            background: "var(--color-accent)",
                            animation: `flow-down 2.4s ease-in-out ${i * 0.8}s infinite`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

          </div>
        </div>

        {/* Right form panel */}
        <div
          className="flex flex-1 items-center justify-center px-6 py-10 lg:px-12"
          style={{ background: "var(--color-bg)" }}
        >
          <div className="w-full max-w-95">{children}</div>
        </div>
      </div>
    </TRPCReactProvider>
  );
}
