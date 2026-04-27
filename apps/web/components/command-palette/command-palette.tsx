"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatStore } from "@/lib/stores/chat";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { useSidebarStore } from "@/lib/stores/sidebar";
import { useUIStore } from "@/lib/stores/ui";
import { Keyboard, PenSquare, MessageSquare, Search, Sun, Moon } from "lucide-react";
import { IS_MAC } from "@/lib/hooks/use-keyboard-shortcuts";

const MOD = IS_MAC ? "⌘" : "Ctrl";
import { cn } from "@/lib/utils";

const RECENT_LIMIT = 5;

const ITEM_META: Record<string, string> = {
  "new-conversation": "Start a fresh chat",
  "toggle-theme": "Switch between light and dark mode",
  "keyboard-shortcuts": "View all keyboard shortcuts",
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { setCurrentConversation } = useChatStore();
  const { theme, setTheme } = usePreferencesStore();
  const { open: openSidebar } = useSidebarStore();
  const { setShortcutsHelpOpen } = useUIStore();

  const [selectedValue, setSelectedValue] = useState("");

  const { data } = useQuery(trpc.conversation.list.queryOptions({ limit: 100 }));
  const conversations = data?.items ?? [];

  const createMutation = useMutation(
    trpc.conversation.create.mutationOptions({
      onSuccess: (conv) => {
        queryClient.invalidateQueries({ queryKey: trpc.conversation.list.queryKey() });
        setCurrentConversation(conv.id);
        router.push(`/c/${conv.id}`);
        onOpenChange(false);
      },
    })
  );

  function handleNewConversation() {
    createMutation.mutate({});
  }

  function handleNavigateConversation(id: string) {
    setCurrentConversation(id);
    openSidebar();
    router.push(`/c/${id}`);
    onOpenChange(false);
  }

  function handleToggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
    onOpenChange(false);
  }

  function handleKeyboardShortcuts() {
    onOpenChange(false);
    setShortcutsHelpOpen(true);
  }

  const currentDescription =
    ITEM_META[selectedValue] ??
    (selectedValue ? "Open this conversation" : null);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-55 bg-black/30"
          onClick={() => onOpenChange(false)}
        />
      )}

      {open && (
        <div className="fixed left-1/2 top-[20%] z-60 w-full max-w-120 -translate-x-1/2 px-4">
          <Command
            value={selectedValue}
            onValueChange={setSelectedValue}
            className={cn(
              "overflow-hidden rounded-xl border border-border bg-popover shadow-2xl",
              "text-popover-foreground"
            )}
          >
            {/* Search input */}
            <div className="flex items-center gap-2.5 border-b border-border px-3.5">
              <Search className="size-3.5 shrink-0 text-muted-foreground/50" />
              <Command.Input
                autoFocus
                placeholder="Type a command or search your chats…"
                className={cn(
                  "flex-1 bg-transparent py-3 text-sm",
                  "placeholder:text-muted-foreground/45 focus:outline-none"
                )}
              />
            </div>

            <Command.List className="max-h-76 overflow-y-auto p-1.5 scrollbar-sidebar">
              <Command.Empty className="px-4 py-6 text-center text-sm text-muted-foreground/60">
                No results found.
              </Command.Empty>

              <Command.Group heading="Actions" className={GROUP_HEADING_CLS}>
                <CommandItem
                  value="new-conversation"
                  onSelect={handleNewConversation}
                  icon={<PenSquare className="size-3.5" />}
                  label="New conversation"
                  keys={[MOD, "⇧", "O"]}
                />
              </Command.Group>

              <Command.Group heading="Settings" className={GROUP_HEADING_CLS}>
                <CommandItem
                  value="toggle-theme"
                  onSelect={handleToggleTheme}
                  icon={theme === "dark" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
                  label="Toggle theme"
                  badge={theme === "dark" ? "dark" : "light"}
                />
                <CommandItem
                  value="keyboard-shortcuts"
                  onSelect={handleKeyboardShortcuts}
                  icon={<Keyboard className="size-3.5" />}
                  label="Keyboard shortcuts"
                  keys={["⇧", "?"]}
                />
              </Command.Group>

              {conversations.length > 0 && (
                <Command.Group heading="Recent conversations" className={GROUP_HEADING_CLS}>
                  {conversations.slice(0, RECENT_LIMIT).map((conv) => (
                    <CommandItem
                      key={conv.id}
                      value={conv.id}
                      onSelect={() => handleNavigateConversation(conv.id)}
                      icon={<MessageSquare className="size-3.5" />}
                      label={conv.title ?? "New conversation"}
                    />
                  ))}
                </Command.Group>
              )}
            </Command.List>

            {/* Bottom hint bar */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-3.5 py-2 min-h-9">
              {currentDescription ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground/55 select-none">
                  {currentDescription}
                  <kbd className="inline-flex items-center justify-center rounded border border-border/60 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
                    ↵
                  </kbd>
                </span>
              ) : (
                <span className="flex items-center gap-3 select-none">
                  <HintKey keys={["↑", "↓"]} label="navigate" />
                  <HintKey keys={["↵"]} label="select" />
                  <HintKey keys={["Esc"]} label="close" />
                </span>
              )}
            </div>
          </Command>
        </div>
      )}
    </>
  );
}

const GROUP_HEADING_CLS =
  "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground/50";

function HintKey({ keys, label }: { keys: string[]; label: string }) {
  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground/45">
      {keys.map((k) => (
        <kbd
          key={k}
          className="inline-flex items-center justify-center rounded border border-border/50 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/55 leading-none"
        >
          {k}
        </kbd>
      ))}
      <span>{label}</span>
    </span>
  );
}

function CommandItem({
  value,
  onSelect,
  icon,
  label,
  keys,
  badge,
}: {
  value: string;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  keys?: string[];
  badge?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm",
        "text-foreground/80 transition-colors",
        "data-[selected=true]:bg-secondary data-[selected=true]:text-foreground",
        "focus:outline-none"
      )}
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded-full border border-border/30 bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground/50">
          {badge}
        </span>
      )}
      {keys && keys.length > 0 && (
        <span className="flex items-center gap-0.5">
          {keys.map((k, i) => (
            <span key={i} className="flex items-center gap-0.5">
              {i > 0 && (
                <span className="text-[10px] text-muted-foreground/65 px-0.5">+</span>
              )}
              <kbd className="inline-flex items-center justify-center rounded border border-border/50 bg-muted min-w-5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/50 leading-none">
                {k}
              </kbd>
            </span>
          ))}
        </span>
      )}
    </Command.Item>
  );
}
