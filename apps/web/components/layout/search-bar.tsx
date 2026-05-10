"use client";

import { useId } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchBar({ value, onChange, className }: SearchBarProps) {
  const inputId = useId();

  return (
    <div
      className={cn("relative flex items-center rounded-lg transition-all duration-150", className)}
      style={{ background: "var(--color-sidebar-hover)", border: "none", outline: "none" }}
    >
      <Search
        className="absolute left-3 size-3.5 shrink-0"
        style={{ color: "var(--color-text-secondary)", opacity: 0.45 }}
      />
      <input
        id={inputId}
        name="conversation-search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search your chats…"
        className={cn(
          "w-full bg-transparent pl-9 pr-7 text-sm",
          "focus:outline-none"
        )}
        style={{
          color: "var(--color-text-primary)",
          paddingTop: "7px",
          paddingBottom: "7px",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2.5 flex size-5 items-center justify-center rounded transition-opacity"
          style={{ color: "var(--color-text-secondary)", opacity: 0.5 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
