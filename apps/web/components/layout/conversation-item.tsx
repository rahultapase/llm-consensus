"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { MoreHorizontal, Star, StarOff, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConversationItemProps {
  id: string;
  title: string;
  isStarred: boolean;
  updatedAt: Date | string;
}

export function ConversationItem({ id, title, isStarred, updatedAt }: ConversationItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === `/c/${id}`;
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Focus rename input on mount
  useEffect(() => {
    if (isRenaming) renameInputRef.current?.select();
  }, [isRenaming]);

  const listKey = trpc.conversation.list.queryKey();

  type ConversationListItem = {
    id: string;
    title: string;
    isStarred: boolean;
  };

  type ConversationListCache = {
    items: ConversationListItem[];
    nextCursor?: string;
  };

  // ── Optimistic helpers ──────────────────────────────────────────────────

  // setQueriesData (not setQueryData) is required here: the sidebar queries
  // conversation.list with { limit: 100 }, so the exact cache key includes
  // the input. setQueriesData uses prefix/partial matching and finds it.
  function optimisticUpdateTitle(newTitle: string) {
    queryClient.setQueriesData<ConversationListCache>({ queryKey: listKey }, (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((conversation) =>
          conversation.id === id ? { ...conversation, title: newTitle } : conversation
        ),
      };
    });
  }

  function optimisticToggleStar(next: boolean) {
    queryClient.setQueriesData<ConversationListCache>({ queryKey: listKey }, (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((conversation) =>
          conversation.id === id ? { ...conversation, isStarred: next } : conversation
        ),
      };
    });
  }

  function optimisticDelete() {
    queryClient.setQueriesData<ConversationListCache>({ queryKey: listKey }, (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.filter((conversation) => conversation.id !== id),
      };
    });
  }

  // ── Mutations ───────────────────────────────────────────────────────────

  const renameMutation = useMutation(
    trpc.conversation.updateTitle.mutationOptions({
      onSuccess: () => toast.success("Conversation renamed"),
      onError: () => {
        queryClient.invalidateQueries({ queryKey: listKey });
        toast.error("Failed to rename conversation");
      },
    })
  );

  const starMutation = useMutation(
    trpc.conversation.toggleStar.mutationOptions({
      onError: () => queryClient.invalidateQueries({ queryKey: listKey }),
    })
  );

  const deleteMutation = useMutation(
    trpc.conversation.delete.mutationOptions({
      onSuccess: () => toast.success("Conversation deleted"),
      onError: () => {
        queryClient.invalidateQueries({ queryKey: listKey });
        toast.error("Failed to delete conversation");
      },
    })
  );

  // ── Rename handlers ─────────────────────────────────────────────────────

  function commitRename() {
    const trimmed = renameValue.trim();
    setIsRenaming(false);
    if (!trimmed || trimmed === title) return;
    optimisticUpdateTitle(trimmed);
    renameMutation.mutate({ id, title: trimmed });
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); commitRename(); }
    else if (e.key === "Escape") { e.preventDefault(); setIsRenaming(false); setRenameValue(title); }
  }

  // ── Menu action handlers ────────────────────────────────────────────────

  function handleToggleStar() {
    const next = !isStarred;
    optimisticToggleStar(next);
    starMutation.mutate({ id, isStarred: next });
  }

  function handleRename() {
    setRenameValue(title);
    // Use rAF to let the dropdown close before the input mounts
    requestAnimationFrame(() => setIsRenaming(true));
  }

  function handleDelete() {
    if (isActive) router.push("/");
    optimisticDelete();
    deleteMutation.mutate({ id });
  }

  const date = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  const dateLabel = formatDate(date);
  const showTrigger = (isHovered || menuOpen) && !isRenaming;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => { if (!isRenaming) router.push(`/c/${id}`); }}
      onKeyDown={(e) => { if (e.key === "Enter" && !isRenaming) router.push(`/c/${id}`); }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-0.5 px-3 py-2",
        "border-l-2 transition-all duration-150",
        isActive ? "border-l-amber-500" : "border-l-transparent",
      )}
      style={{
        background: isActive || isHovered || menuOpen ? "var(--color-sidebar-hover)" : "transparent",
        borderRadius: "0 8px 8px 0",
      }}
    >
      {/* Title / Inline rename input */}
      {isRenaming ? (
        <input
          ref={renameInputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={handleRenameKeyDown}
          onBlur={commitRename}
          onClick={(e) => e.stopPropagation()}
          className="w-full truncate rounded bg-transparent text-sm font-medium leading-snug outline-none ring-1 ring-amber-500/60 focus:ring-amber-500 px-0.5 -mx-0.5 pr-6"
          style={{ color: "var(--color-text-primary)" }}
          maxLength={200}
        />
      ) : (
        <span
          className="truncate text-sm font-medium leading-snug pr-6"
          style={{ color: "var(--color-text-primary)" }}
        >
          {title}
        </span>
      )}

      {/* Date */}
      <span
        className="text-xs leading-none"
        style={{ color: "var(--color-text-secondary)", opacity: 0.65 }}
      >
        {dateLabel}
      </span>

      {/* 3-dot menu trigger */}
      <DropdownMenu.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            aria-label="Conversation options"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            tabIndex={-1}
            className={cn(
              "absolute right-1.5 top-1/2 -translate-y-1/2",
              "flex size-6 items-center justify-center rounded",
              "transition-opacity duration-100",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500",
              showTrigger ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-text-primary)";
              e.currentTarget.style.background = "color-mix(in srgb, var(--color-border) 80%, transparent)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-text-secondary)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <MoreHorizontal className="size-3.5" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            side="right"
            align="start"
            sideOffset={4}
            onClick={(e) => e.stopPropagation()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            className="z-200 min-w-40 rounded-lg border p-1 shadow-xl animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            style={{
              background: "var(--color-sidebar-bg)",
              borderColor: "var(--color-border)",
            }}
          >
            {/* Star / Unstar */}
            <DropdownMenu.Item
              onSelect={handleToggleStar}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm outline-none select-none transition-colors duration-100"
              style={{ color: "var(--color-text-primary)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-sidebar-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {isStarred ? (
                <><StarOff className="size-3.5 shrink-0" /><span>Unstar</span></>
              ) : (
                <><Star className="size-3.5 shrink-0" /><span>Star</span></>
              )}
            </DropdownMenu.Item>

            {/* Rename */}
            <DropdownMenu.Item
              onSelect={handleRename}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm outline-none select-none transition-colors duration-100"
              style={{ color: "var(--color-text-primary)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-sidebar-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Pencil className="size-3.5 shrink-0" />
              <span>Rename</span>
            </DropdownMenu.Item>

            <DropdownMenu.Separator
              style={{ height: 1, background: "var(--color-border)", opacity: 0.3, margin: "4px 0" }}
            />

            {/* Delete */}
            <DropdownMenu.Item
              onSelect={handleDelete}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm outline-none select-none transition-colors duration-100"
              style={{ color: "var(--color-destructive, #ef4444)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-sidebar-hover)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Trash2 className="size-3.5 shrink-0" />
              <span>Delete</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
