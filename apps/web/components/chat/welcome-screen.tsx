"use client";

import { useState } from "react";
import { Wand2, Compass, Code, BookOpen, ChevronRight, Eye } from "lucide-react";
import { useUsername } from "@/lib/stores/user";
import { useChatStore } from "@/lib/stores/chat";

const CATEGORIES = [
  { key: "create", label: "Create", icon: Wand2, desktopOnly: false },
  { key: "explore", label: "Explore", icon: Compass, desktopOnly: false },
  { key: "code", label: "Code", icon: Code, desktopOnly: false },
  { key: "learn", label: "Learn", icon: BookOpen, desktopOnly: true },
] as const;

type Category = (typeof CATEGORIES)[number]["key"];

const DEFAULT_SUGGESTIONS = [
  "What are the most useful skills to learn right now?",
  "How does artificial intelligence work in simple terms?",
  "How do I improve my critical thinking skills?",
  "How can I protect my personal data online?",
];

const SUGGESTIONS: Record<Category, string[]> = {
  create: [
    "Write a product launch email for a SaaS tool",
    "Create a weekly meal plan for vegetarians",
    "Generate landing page copy for a fitness app",
    "Write a short story about a robot discovering emotions",
  ],
  explore: [
    "What caused the 2008 financial crisis?",
    "How do recommendation algorithms work?",
    "What is the future of blockchain beyond crypto?",
    "Explain the history of the internet in 5 paragraphs",
  ],
  code: [
    "Explain the difference between async/await and Promises",
    "Explain React's useEffect cleanup function",
    "Write code to invert a binary search tree in Python?",
    "Review this Python function for bugs: [paste code]",
  ],
  learn: [
    "What are the basics of cybersecurity",
    "What is the fastest way to learn SQL?",
    "Give me a 30-day roadmap to learn TypeScript",
    "What are the key concepts in system design interviews?",
  ],
};

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const username = useUsername();
  const { isTemporary } = useChatStore();
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);

  function handlePillClick(key: Category) {
    setActiveCategory((prev) => (prev === key ? null : key));
  }

  const currentSuggestions = activeCategory
    ? SUGGESTIONS[activeCategory]
    : DEFAULT_SUGGESTIONS;

  return (
    <div className="flex flex-1 flex-col pt-26 sm:justify-center sm:pt-0">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 sm:gap-6">
        {/* Heading */}
        {isTemporary ? (
          <div>
            <h1
              className="flex items-center gap-3 text-xl font-bold sm:text-2xl"
              style={{ color: "var(--color-text-primary)" }}
            >
              <Eye className="size-6" />
              Temporary chat
            </h1>
            <p
              className="mt-1.5 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              This conversation won&apos;t be saved.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <h1
              className="text-xl font-bold sm:text-2xl"
              style={{ color: "var(--color-text-primary)" }}
            >
              {username
                ? `How can I help you, ${username.charAt(0).toUpperCase() + username.slice(1)}?`
                : "How can I help you?"}
            </h1>
          </div>
        )}

        {/* Category pills */}
        <div
          className="flex flex-nowrap items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {CATEGORIES.map(({ key, label, icon: Icon, desktopOnly }) => {
            const isActive = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => handlePillClick(key)}
                className={`${desktopOnly ? "hidden sm:flex" : "flex"} items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
                style={{
                  background: isActive
                    ? "var(--color-btn-primary-bg)"
                    : "transparent",
                  color: isActive
                    ? "var(--color-btn-primary-fg)"
                    : "var(--color-text-secondary)",
                  border: isActive
                    ? "1px solid var(--color-btn-primary-bg)"
                    : "1px solid var(--color-border)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background =
                      "var(--color-sidebar-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Suggestion items */}
        <div className="w-full overflow-hidden rounded-xl">
          {currentSuggestions.map((suggestion, i) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-1 focus-visible:ring-ring sm:py-3.5"
              style={{
                color: "var(--color-text-primary)",
                background: "transparent",
                borderBottom:
                  i < currentSuggestions.length - 1
                    ? "1px solid var(--color-border)"
                    : "none",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background =
                  "var(--color-sidebar-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <span className="leading-snug">{suggestion}</span>
              <ChevronRight
                className="ml-3 size-3.5 shrink-0 opacity-30"
                style={{ color: "var(--color-text-primary)" }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
