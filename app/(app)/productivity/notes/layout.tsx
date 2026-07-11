import { NotesWorkspaceProvider } from "@/components/notes/NotesWorkspaceContext";
import NotesLayout from "@/components/notes/NotesLayout";

export default function ProductivityNotesLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotesWorkspaceProvider>
      <NotesLayout>{children}</NotesLayout>
    </NotesWorkspaceProvider>
  );
}
