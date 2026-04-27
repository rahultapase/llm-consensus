import { cn } from "@/lib/utils";

interface UserMessageProps {
  content: string;
  className?: string;
}

export function UserMessage({ content, className }: UserMessageProps) {
  return (
    <div className={cn("flex justify-end", className)}>
      <div
        className={cn(
          "relative max-w-[78%] rounded-2xl rounded-br-sm px-4 py-3",
          "text-sm leading-relaxed whitespace-pre-wrap",
          "shadow-sm"
        )}
        style={{
          background: "var(--color-user-msg-bg)",
          color: "var(--color-user-msg-fg)",
        }}
      >
        {content}
      </div>
    </div>
  );
}

