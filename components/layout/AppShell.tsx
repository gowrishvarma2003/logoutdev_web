"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useNotificationSummary } from "@/lib/hooks/useNotifications";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import MobileNav from "./MobileNav";
import Spinner from "../ui/Spinner";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Protected shell — redirects to /login if no auth token is found.
 * Provides responsive 3-column layout: Sidebar | Feed | RightPanel.
 */
export default function AppShell({ children }: AppShellProps) {
  const { user, isLoaded, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { summary } = useNotificationSummary();
  const hideRightPanel = pathname.startsWith("/notes");
  const isPublicSpaceRoute =
    pathname === "/spaces" ||
    (pathname.startsWith("/spaces/") &&
      pathname !== "/spaces/create" &&
      !pathname.includes("/settings") &&
      !pathname.endsWith("/join") &&
      !pathname.endsWith("/manage"));
  const isPublicRepoRoute =
    pathname === "/repos" ||
    (pathname.startsWith("/repos/") && !pathname.endsWith("/settings"));
  const allowsGuest =
    pathname === "/questions" ||
    pathname.startsWith("/questions/") ||
    pathname === "/explore" ||
    isPublicSpaceRoute ||
    isPublicRepoRoute ||
    pathname === "/launches" ||
    pathname === "/freelance" ||
    (pathname.startsWith("/launches/") &&
      pathname !== "/launches/new" &&
      pathname !== "/launches/me" &&
      !pathname.endsWith("/edit") &&
      !pathname.endsWith("/collaborate")) ||
    (pathname.startsWith("/freelance/") &&
      pathname !== "/freelance/create" &&
      !pathname.startsWith("/freelance/my-") &&
      !pathname.endsWith("/edit") &&
      !pathname.endsWith("/proposals"));

  useEffect(() => {
    if (isLoaded && !user && !allowsGuest) {
      router.push("/login");
    }
  }, [allowsGuest, isLoaded, user, router]);

  // Show centered spinner while resolving auth from localStorage
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user && allowsGuest) {
    return (
      <div className="min-h-screen bg-app">
        <header className="sticky top-0 z-sticky border-b border-border-subtle bg-app/90 shadow-sticky backdrop-blur-md">
          <div className="mx-auto flex max-w-[1520px] items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/logo.jpeg"
                alt="LogoutDev"
                className="h-8 w-8 rounded-full object-cover"
              />
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-border-default px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Create account
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-screen w-full max-w-[1020px] border-x border-border-subtle bg-app">
          {children}
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app text-text-primary">
      {/* ── Centered 3-column wrapper with wider content area and reduced outer gutters ── */}
      <div className="flex min-h-screen w-full">
        {/* ── Left sidebar (sticky, desktop only) ── */}
        <aside className="hidden lg:flex flex-col w-[240px] shrink-0 border-r border-border-subtle bg-app/95 sticky top-0 h-screen overflow-y-auto shadow-sticky">
          <Sidebar
            user={user}
            onLogout={logout}
            unreadCount={summary.unread_count}
            needsActionCount={summary.needs_action_count}
          />
        </aside>

        {/* ── Center feed column ── */}
        <main className="flex-1 min-w-0">
          <div className="w-full border-x border-border-subtle min-h-screen bg-app pb-20 lg:pb-0">
            {children}
          </div>
        </main>

        {!hideRightPanel ? (
          <aside className="hidden xl:flex flex-col w-[280px] shrink-0 border-l border-border-subtle bg-app/95 sticky top-0 h-screen overflow-y-auto">
            <RightPanel currentUser={user} />
          </aside>
        ) : null}
      </div>

      {/* ── Mobile bottom navigation bar ── */}
      <MobileNav
        userId={user.id}
        username={user.username}
        unreadCount={summary.unread_count}
        needsActionCount={summary.needs_action_count}
        onLogout={logout}
      />
    </div>
  );
}
