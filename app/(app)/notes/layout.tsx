import { NotesWorkspaceProvider } from "@/components/notes/NotesWorkspaceContext";
import NotesLayout from "@/components/notes/NotesLayout";

/**
 * Shared shell for /notes and /notes/[noteId]: sidebar (folders/tags/nav)
 * beside whichever main content the nested page renders.
 */
export default function NotesRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotesWorkspaceProvider>
      <NotesLayout>{children}</NotesLayout>
    </NotesWorkspaceProvider>
  );
}
