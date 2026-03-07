"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
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
  const allowsGuest = pathname === "/questions" || pathname.startsWith("/questions/");

  useEffect(() => {
    if (isLoaded && !user && !allowsGuest) {
      router.push("/login");
    }
  }, [allowsGuest, isLoaded, user, router]);

  // Show centered spinner while resolving auth from localStorage
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user && allowsGuest) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
                <span className="text-xs font-bold text-zinc-950">LD</span>
              </div>
              <span className="text-[17px] font-bold tracking-tight text-white">LogoutDev</span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
              >
                Create account
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-screen w-full max-w-[860px] border-x border-zinc-800 bg-zinc-950">
          {children}
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* ── Centered 3-column wrapper: sidebar(240) + feed(600) + right(280) = 1120px ── */}
      <div className="mx-auto flex min-h-screen w-full max-w-[1120px]">
        {/* ── Left sidebar (sticky, desktop only) ── */}
        <aside className="hidden lg:flex flex-col w-[240px] shrink-0 border-r border-zinc-800 bg-zinc-950 sticky top-0 h-screen overflow-y-auto">
          <Sidebar user={user} onLogout={logout} />
        </aside>

        {/* ── Center feed column ── */}
        <main className="flex-1 min-w-0">
          <div className="w-full border-x border-zinc-800 min-h-screen bg-zinc-950 pb-20 lg:pb-0">
            {children}
          </div>
        </main>

        {/* ── Right info panel (sticky, xl+ only) ── */}
        <aside className="hidden xl:flex flex-col w-[280px] shrink-0 border-l border-zinc-800 bg-zinc-950 sticky top-0 h-screen overflow-y-auto">
          <RightPanel currentUser={user} />
        </aside>
      </div>

      {/* ── Mobile bottom navigation bar ── */}
      <MobileNav userId={user.id} username={user.username} />
    </div>
  );
}
