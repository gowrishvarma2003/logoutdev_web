"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NotesSidebar from "./NotesSidebar";
import { useNotesWorkspace } from "./NotesWorkspaceContext";
import { Bars3Icon } from "@/components/ui/Icons";

/**
 * Notion-like shell: a fixed-width sidebar (folders/tags/nav) beside the
 * main content slot. On mobile the sidebar becomes an off-canvas drawer
 * toggled from a small top bar, keeping the editor full width.
 */
export default function NotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useNotesWorkspace();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  return (
    <div className="flex h-[calc(100dvh-64px)] min-h-0 overflow-hidden bg-zinc-950 lg:h-[calc(100dvh-64px)]">
      {mobileSidebarOpen ? (
        <div
          className="fixed inset-0 z-55 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-60 w-70 shrink-0 border-r border-zinc-800 bg-zinc-950 transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-65 lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NotesSidebar />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-3 py-2.5 lg:hidden">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800/70 hover:text-white"
            aria-label="Open notes menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-white">Notes</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
