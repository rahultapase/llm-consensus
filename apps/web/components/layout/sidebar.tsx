"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PenSquare,
  Search,
  LogIn,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Popover } from "radix-ui";
import { Tooltip } from "@/components/ui/tooltip";
import { SHORTCUT_LABELS } from "@/lib/shortcut-labels";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSidebarStore } from "@/lib/stores/sidebar";
import { useChatStore } from "@/lib/stores/chat";
import { useUIStore } from "@/lib/stores/ui";
import { useUserStore } from "@/lib/stores/user";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ConversationItem } from "./conversation-item";
import { SearchBar } from "./search-bar";
import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";

const SIDEBAR_WIDTH = 250;
const RAIL_WIDTH = 56;



/** Derive a stable hue from a string for the initials avatar. */
function hashColor(str: string | null): string {
  if (!str) return "hsl(200, 55%, 50%)";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 360) + 360) % 360;
  return `hsl(${hue}, 55%, 50%)`;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function Sidebar() {
  const { isOpen, open, close, toggle, hydrate } = useSidebarStore();
  const { setCurrentConversation } = useChatStore();
  const { toggleCommandPalette } = useUIStore();
  const username = useUserStore((s) => s.username);
  const avatarUrl = useUserStore((s) => s.avatarUrl);
  const email = useUserStore((s) => s.email);
  const clearUser = useUserStore((s) => s.clearUser);
  const isProfileLoaded = useUserStore((s) => s.isProfileLoaded);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [profilePopover, setProfilePopover] = useState(false);
  const [railProfilePopover, setRailProfilePopover] = useState(false);

  const isLoggedIn = !!(username || email);
  const displayName = username
    ? username.charAt(0).toUpperCase() + username.slice(1)
    : (email ?? "");

  // Hydrate localStorage state on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    function handler(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
    }
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearUser();
    setProfilePopover(false);
    toast.success("Signed out");
    router.push("/login");
  }, [clearUser, router]);

  const { data, isLoading } = useQuery(
    trpc.conversation.list.queryOptions({ limit: 100 })
  );

  const allConversations = data?.items ?? [];

  const filtered = search.trim()
    ? allConversations.filter((c) =>
        (c.title ?? "New conversation")
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      )
    : allConversations;

  // Build a flat array of virtual rows: section headers + conversations
  type VirtualRow =
    | { type: "header"; label: string }
    | { type: "conversation"; conv: (typeof filtered)[number] };

  const virtualRows: VirtualRow[] = [];
  if (!search.trim()) {
    const starred = filtered.filter((c) => c.isStarred);
    const recent = filtered; // always show all
    if (starred.length > 0) {
      virtualRows.push({ type: "header", label: "Starred" });
      for (const c of starred) virtualRows.push({ type: "conversation", conv: c });
    }
    virtualRows.push({ type: "header", label: "Recent" });
    for (const c of recent) virtualRows.push({ type: "conversation", conv: c });
  } else {
    // search mode: flat list with "Results" header
    virtualRows.push({ type: "header", label: "Results" });
    for (const c of filtered) virtualRows.push({ type: "conversation", conv: c });
  }

  const createMutation = useMutation(
    trpc.conversation.create.mutationOptions({
      onSuccess: (conv) => {
        queryClient.invalidateQueries({ queryKey: trpc.conversation.list.queryKey() });
        setCurrentConversation(conv.id);
        router.push(`/c/${conv.id}`);
      },
    })
  );

  const rowVirtualizer = useVirtualizer({
    count: virtualRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (virtualRows[i]?.type === "header" ? 32 : 56),
    overscan: 5,
  });

  // On mobile: sidebar is either fully shown (overlay) or fully hidden
  // On desktop: sidebar is either full-width or narrow icon rail
  const sidebarWidth = isMobile
    ? isOpen
      ? SIDEBAR_WIDTH
      : 0
    : isOpen
      ? SIDEBAR_WIDTH
      : RAIL_WIDTH;

  const isHidden = isMobile && !isOpen;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        data-testid="sidebar"
        className="fixed top-0 left-0 z-50 flex h-full flex-col border-r overflow-hidden"
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          transition: "width 200ms ease",
          background: "var(--color-sidebar-bg)",
          borderColor: isHidden ? "transparent" : "var(--color-border)",
          visibility: isHidden ? "hidden" : "visible",
        }}
      >
        {/* ── EXPANDED: full sidebar ─────────────────────── */}
        {isOpen && (
          <>
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between px-4">
              <Logo size={26} withWordmark href="/" />
              <Tooltip label="Close sidebar" shortcut={SHORTCUT_LABELS.toggleSidebar}>
                <button
                  onClick={toggle}
                  aria-label="Collapse sidebar"
                  className="flex size-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  style={{ color: "var(--color-text-secondary)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget.style.color = "var(--color-text-primary)");
                    (e.currentTarget.style.background = "var(--color-sidebar-hover)");
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget.style.color = "var(--color-text-secondary)");
                    (e.currentTarget.style.background = "transparent");
                  }}
                >
                  <PanelLeftClose className="size-4.5" />
                </button>
              </Tooltip>
            </div>

            {/* New conversation button */}
            <div className="px-3 pb-2">
              <button
                onClick={() => createMutation.mutate({})}
                disabled={createMutation.isPending}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40"
                style={{
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-sidebar-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <PenSquare className="size-4 shrink-0" />
                <span>{createMutation.isPending ? "Creating…" : "New chat"}</span>
              </button>
            </div>

            {/* Search bar */}
            <div className="px-3 pb-0">
              <SearchBar value={search} onChange={setSearch} />
            </div>

            {/* Separator under search */}
            <div
              className="mx-3 my-3 opacity-30"
              style={{ borderTop: "1px solid var(--color-border)" }}
            />

            {/* Conversation list — virtualized (includes section headers) */}
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-sidebar">
              {isLoading ? (
                <div className="px-3 pt-1 flex flex-col gap-0" aria-label="Loading conversations">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-2 py-2" style={{ height: 56 }}>
                      <Skeleton className="size-7 shrink-0 rounded-full" />
                      <div className="flex flex-1 flex-col gap-1.5">
                        <Skeleton className="h-3 rounded" style={{ width: `${60 + (i % 3) * 15}%` }} />
                        <Skeleton className="h-2.5 rounded" style={{ width: "40%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className="px-3 py-4 text-xs opacity-50"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {search ? "No matches" : "No conversations yet"}
                </div>
              ) : (
                <div
                  style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                  className="relative w-full"
                >
                  {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const row = virtualRows[virtualItem.index];
                    return (
                      <div
                        key={virtualItem.index}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        {row.type === "header" ? (
                          <div
                            className="flex items-center px-3"
                            style={{ height: "100%" }}
                          >
                            <span
                              className="shrink-0 text-[12.5px] font-medium"
                              style={{ color: "var(--color-text-secondary)", opacity: 0.6, letterSpacing: "0.02em" }}
                            >
                              {row.label}
                            </span>
                          </div>
                        ) : (
                          <ConversationItem
                            id={row.conv.id}
                            title={row.conv.title ?? "New Conversation"}
                            isStarred={row.conv.isStarred}
                            updatedAt={row.conv.updatedAt}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom separator */}
            <div
              className="mx-3 mt-1 opacity-20"
              style={{ borderTop: "1px solid var(--color-border)" }}
            />

            {/* Bottom: Login or Profile */}
            <div className="shrink-0 px-2 pb-2">
              {!isProfileLoaded ? (
                <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
                  <Skeleton className="size-7.5 shrink-0 rounded-full" />
                  <Skeleton className="h-3 rounded" style={{ width: "55%" }} />
                </div>
              ) : !isLoggedIn ? (
                <button
                  onClick={() => router.push("/login")}
                  className="flex w-full items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    color: "var(--color-text-primary)",
                    borderColor: "var(--color-border)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--color-sidebar-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <LogIn className="size-4" />
                  Log in
                </button>
              ) : (
                <Popover.Root open={profilePopover} onOpenChange={setProfilePopover}>
                  <Popover.Trigger asChild>
                    <button
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors"
                      style={{ color: "var(--color-text-primary)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--color-sidebar-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt=""
                          className="size-7.5 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className="flex size-7.5 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ background: hashColor(displayName) }}
                        >
                          {getInitials(displayName)}
                        </span>
                      )}
                      <span className="truncate text-sm font-medium">{displayName}</span>
                      <ChevronRight
                        className="ml-auto size-3.5 shrink-0 transition-transform"
                        style={{
                          color: "var(--color-text-secondary)",
                          transform: profilePopover ? "rotate(-90deg)" : "rotate(90deg)",
                        }}
                      />
                    </button>
                  </Popover.Trigger>
                  <Popover.Portal>
                    <Popover.Content
                      side="top"
                      align="start"
                      sideOffset={4}
                      style={{
                        width: `${SIDEBAR_WIDTH - 16}px`,
                        background: "var(--color-sidebar-bg)",
                        borderColor: "var(--color-border)",
                      }}
                      className="z-200 rounded-lg border p-1 shadow-xl"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <div
                        className="px-2.5 py-2 text-xs opacity-50 truncate"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {email || displayName}
                      </div>
                      <div
                        className="mx-1 mb-1 opacity-20"
                        style={{ borderTop: "1px solid var(--color-border)" }}
                      />
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors"
                        style={{ color: "var(--color-text-primary)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--color-sidebar-hover)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <LogOut className="size-3.5" />
                        Sign out
                      </button>
                    </Popover.Content>
                  </Popover.Portal>
                </Popover.Root>
              )}
            </div>
          </>
        )}

        {/* ── COLLAPSED: narrow icon rail ────────────────── */}
        {!isOpen && !isMobile && (
          <div className="flex h-full flex-col items-center py-1.5 gap-1">
            {/* Toggle open */}
            <Tooltip label="Open sidebar" shortcut={SHORTCUT_LABELS.toggleSidebar} side="right">
              <button
                onClick={open}
                aria-label="Expand sidebar"
                className="flex size-9 items-center justify-center rounded-md transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-secondary)")
                }
              >
                <PanelLeftOpen className="size-4" />
              </button>
            </Tooltip>

            {/* New chat */}
            <Tooltip label="New chat" shortcut={SHORTCUT_LABELS.newChat} side="right">
              <button
                onClick={() => createMutation.mutate({})}
                disabled={createMutation.isPending}
                aria-label="New chat"
                className="flex size-9 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-40"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-secondary)")
                }
              >
                <PenSquare className="size-4" />
              </button>
            </Tooltip>

            {/* Search — opens command palette */}
            <Tooltip label="Search" shortcut={SHORTCUT_LABELS.search} side="right">
              <button
                onClick={toggleCommandPalette}
                aria-label="Search conversations"
                className="flex size-9 items-center justify-center rounded-md transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-secondary)")
                }
              >
                <Search className="size-4" />
              </button>
            </Tooltip>

            {/* Spacer */}
            <div className="flex-1" />

            {/* User avatar / Login */}
            {!isLoggedIn ? (
              <Tooltip label="Log in" side="right">
                <button
                  onClick={() => router.push("/login")}
                  aria-label="Log in"
                  className="flex size-9 items-center justify-center rounded-md transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-text-primary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--color-text-secondary)")
                  }
                >
                  <LogIn className="size-4" />
                </button>
              </Tooltip>
            ) : (
              <Popover.Root open={railProfilePopover} onOpenChange={setRailProfilePopover}>
                <Popover.Trigger asChild>
                  <button
                    aria-label="Profile"
                    className="mb-1.5 flex size-9 items-center justify-center rounded-lg transition-colors"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--color-sidebar-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="size-7.5 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="flex size-7.5 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ background: hashColor(displayName) }}
                      >
                        {getInitials(displayName)}
                      </span>
                    )}
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    side="right"
                    sideOffset={8}
                    align="end"
                    className="z-200 w-48 rounded-lg border p-1 shadow-xl"
                    style={{
                      background: "var(--color-sidebar-bg)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div className="px-2.5 py-2">
                      <p
                        className="truncate text-sm font-medium"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {displayName}
                      </p>
                      {email && (
                        <p
                          className="truncate text-xs opacity-50"
                          style={{ color: "var(--color-text-secondary)" }}
                        >
                          {email}
                        </p>
                      )}
                    </div>
                    <div
                      className="mx-1 mb-1 opacity-20"
                      style={{ borderTop: "1px solid var(--color-border)" }}
                    />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors"
                      style={{ color: "var(--color-text-primary)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "var(--color-sidebar-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <LogOut className="size-3.5" />
                      Sign out
                    </button>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
