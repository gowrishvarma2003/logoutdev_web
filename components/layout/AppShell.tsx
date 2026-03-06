"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login");
    }
  }, [isLoaded, user, router]);

  // Show centered spinner while resolving auth from localStorage
  if (!isLoaded || !user) {
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
