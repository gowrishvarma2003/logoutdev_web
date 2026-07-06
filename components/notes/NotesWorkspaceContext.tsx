"use client";

import { createContext, useContext, useState } from "react";
import { useFolders } from "@/lib/hooks/useNoteFolders";
import { useTags } from "@/lib/hooks/useNoteTags";

interface NotesWorkspaceContextValue {
  folders: ReturnType<typeof useFolders>;
  tags: ReturnType<typeof useTags>;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
}

const NotesWorkspaceContext = createContext<NotesWorkspaceContextValue | null>(null);

/**
 * Holds the note workspace's folders/tags (with CRUD) so counts stay in
 * sync everywhere — the sidebar, the notes list, and the editor's
 * move/tag actions all share this single source of truth.
 */
export function NotesWorkspaceProvider({ children }: { children: React.ReactNode }) {
  const folders = useFolders();
  const tags = useTags();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <NotesWorkspaceContext.Provider value={{ folders, tags, mobileSidebarOpen, setMobileSidebarOpen }}>
      {children}
    </NotesWorkspaceContext.Provider>
  );
}

export function useNotesWorkspace() {
  const context = useContext(NotesWorkspaceContext);
  if (!context) {
    throw new Error("useNotesWorkspace must be used within a NotesWorkspaceProvider");
  }
  return context;
}
