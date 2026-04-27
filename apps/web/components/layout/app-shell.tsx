"use client";

import { useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { ShortcutsHelpModal } from "@/components/shortcuts/shortcuts-help-modal";
import { ModeConfigDialog } from "@/components/council/mode-config-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/lib/stores/sidebar";
import { useChatStore } from "@/lib/stores/chat";
import { useUIStore } from "@/lib/stores/ui";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // ── Stores ──────────────────────────────────────────────────────
  const { toggle: toggleSidebar } = useSidebarStore();
  const {
    currentConversationId,
    setCurrentConversation,
    councilMode,
    isTemporary,
    toggleTemporaryChat,
  } = useChatStore();
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleCommandPalette,
    shortcutsHelpOpen,
    setShortcutsHelpOpen,
    modelPickerOpen,
    setModelPickerOpen,
    deleteConfirmConversationId,
    setDeleteConfirmConversationId,
  } = useUIStore();

  // ── Data ────────────────────────────────────────────────────────
  const { data: convData } = useQuery(
    trpc.conversation.list.queryOptions({ limit: 100 })
  );
  const conversations = useMemo(() => convData?.items ?? [], [convData?.items]);

  // ── Mutations ───────────────────────────────────────────────────
  const { mutate: createConversation } = useMutation(
    trpc.conversation.create.mutationOptions({
      onSuccess: (conv) => {
        queryClient.invalidateQueries({
          queryKey: trpc.conversation.list.queryKey(),
        });
        setCurrentConversation(conv.id);
        router.push(`/c/${conv.id}`);
      },
    })
  );

  const { mutate: deleteConversation, isPending: isDeleting } = useMutation(
    trpc.conversation.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.conversation.list.queryKey(),
        });
        if (deleteConfirmConversationId === currentConversationId) {
          setCurrentConversation(null);
          router.push("/");
        }
        setDeleteConfirmConversationId(null);
      },
      onError: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.conversation.list.queryKey(),
        });
        setDeleteConfirmConversationId(null);
      },
    })
  );

  // ── Handlers ────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    if (isTemporary) {
      router.push("/temp");
    } else {
      createConversation({});
    }
  }, [isTemporary, createConversation, router]);

  const handleNavigate = useCallback(
    (direction: "prev" | "next") => {
      if (!currentConversationId || conversations.length === 0) return;
      const idx = conversations.findIndex((c) => c.id === currentConversationId);
      if (idx === -1) return;
      const nextIdx =
        direction === "prev"
          ? Math.max(0, idx - 1)
          : Math.min(conversations.length - 1, idx + 1);
      if (nextIdx === idx) return;
      const next = conversations[nextIdx];
      setCurrentConversation(next.id);
      router.push(`/c/${next.id}`);
    },
    [conversations, currentConversationId, router, setCurrentConversation]
  );

  const handleDeleteCurrentChat = useCallback(() => {
    if (currentConversationId) {
      setDeleteConfirmConversationId(currentConversationId);
    }
  }, [currentConversationId, setDeleteConfirmConversationId]);

  // ── Shortcuts ───────────────────────────────────────────────────
  const shortcuts = useMemo(
    () => [
      // ── Navigation ────────────────────────────────────────────
      {
        key: "k",
        ctrl: true,
        ignoreInputGuard: true,
        handler: toggleCommandPalette,
      },
      {
        key: "b",
        ctrl: true,
        ignoreInputGuard: true,
        handler: toggleSidebar,
      },
      {
        key: "o",
        ctrl: true,
        shift: true,
        ignoreInputGuard: true,
        handler: handleNewChat,
      },
      {
        key: "ArrowUp",
        ctrl: true,
        alt: true,
        ignoreInputGuard: true,
        handler: () => handleNavigate("prev"),
      },
      {
        key: "ArrowDown",
        ctrl: true,
        alt: true,
        ignoreInputGuard: true,
        handler: () => handleNavigate("next"),
      },
      // ── Chat actions ──────────────────────────────────────────
      {
        key: "/",
        ctrl: true,
        ignoreInputGuard: true,
        handler: () => setModelPickerOpen(true),
      },
      {
        key: "Backspace",
        ctrl: true,
        shift: true,
        handler: handleDeleteCurrentChat,
      },
      {
        key: "i",
        ctrl: true,
        shift: true,
        ignoreInputGuard: true,
        handler: toggleTemporaryChat,
      },
      // ── Help / dismiss ────────────────────────────────────────
      {
        key: "?",
        shift: true,
        handler: () => setShortcutsHelpOpen(true),
      },
      {
        key: "Escape",
        ignoreInputGuard: true,
        handler: () => {
          if (commandPaletteOpen) setCommandPaletteOpen(false);
          else if (shortcutsHelpOpen) setShortcutsHelpOpen(false);
        },
      },
    ],
    [
      toggleCommandPalette,
      toggleSidebar,
      handleNewChat,
      handleNavigate,
      setModelPickerOpen,
      handleDeleteCurrentChat,
      toggleTemporaryChat,
      setShortcutsHelpOpen,
      commandPaletteOpen,
      setCommandPaletteOpen,
      shortcutsHelpOpen,
    ]
  );

  useKeyboardShortcuts(shortcuts);

  const deleteTarget = conversations.find(
    (c) => c.id === deleteConfirmConversationId
  );

  return (
    <>
      {children}

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />

      <ShortcutsHelpModal />

      {/* Global model picker — triggered by Ctrl+/ */}
      <ModeConfigDialog
        open={modelPickerOpen}
        onOpenChange={setModelPickerOpen}
        mode={councilMode}
      />

      {/* Delete-chat confirmation — triggered by Ctrl+Shift+Backspace */}
      <Dialog
        open={deleteConfirmConversationId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmConversationId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            &ldquo;{deleteTarget?.title ?? "This conversation"}&rdquo; will be
            permanently deleted and cannot be recovered.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmConversationId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                if (deleteConfirmConversationId) {
                  deleteConversation({ id: deleteConfirmConversationId });
                }
              }}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
