"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NoteSearch from "./NoteSearch";
import FolderList from "./FolderList";
import TagList from "./TagList";
import { useCreateNote } from "@/lib/hooks/useNotes";
import { useToast } from "@/lib/hooks/useToast";
import { notesViewHref, parseNotesView, type NotesViewKey } from "@/lib/notesView";
import {
  PlusIcon,
  DocumentTextIcon,
  StarIcon,
  PinIcon,
  ClockIcon,
  ArchiveBoxIcon,
  TrashIcon,
} from "@/components/ui/Icons";
import Spinner from "@/components/ui/Spinner";

const PRIMARY_NAV: Array<{ key: NotesViewKey; label: string; icon: React.ReactNode }> = [
  { key: "all", label: "All Notes", icon: <DocumentTextIcon className="h-4 w-4" /> },
  { key: "favorites", label: "Favorites", icon: <StarIcon className="h-4 w-4" /> },
  { key: "pinned", label: "Pinned", icon: <PinIcon className="h-4 w-4" /> },
  { key: "recent", label: "Recent", icon: <ClockIcon className="h-4 w-4" /> },
];

const SECONDARY_NAV: Array<{ key: NotesViewKey; label: string; icon: React.ReactNode }> = [
  { key: "archived", label: "Archived", icon: <ArchiveBoxIcon className="h-4 w-4" /> },
  { key: "trash", label: "Trash", icon: <TrashIcon className="h-4 w-4" /> },
];

export default function NotesSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { createNote, creating } = useCreateNote();
  const parsed = parseNotesView(searchParams);

  async function handleNewNote() {
    try {
      const folderId = searchParams.get("folder");
      const note = await createNote(folderId ? { folder_id: folderId } : {});
      router.push(`/notes/${note.id}`);
    } catch {
      showToast("Couldn't create note", { tone: "error", description: "Check your connection and try again." });
    }
  }

  function isActive(key: NotesViewKey) {
    return !parsed.folderId && !parsed.tagId && parsed.view === key;
  }

  return (
    <nav className="flex h-full flex-col overflow-y-auto px-3 py-4">
      <button
        onClick={handleNewNote}
        disabled={creating}
        className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        {creating ? <Spinner size="sm" /> : <PlusIcon className="h-4 w-4" />}
        New note
      </button>

      <div className="mb-4">
        <NoteSearch />
      </div>

      <div className="flex flex-col gap-0.5">
        {PRIMARY_NAV.map((item) => (
          <Link
            key={item.key}
            href={notesViewHref({ view: item.key })}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
              isActive(item.key) ? "bg-surface-hover text-text-primary" : "text-text-muted hover:bg-surface-hover/60 hover:text-text-primary"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      <div className="my-3 border-t border-border-default/60" />

      <div className="flex flex-col gap-0.5">
        {SECONDARY_NAV.map((item) => (
          <Link
            key={item.key}
            href={notesViewHref({ view: item.key })}
            className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
              isActive(item.key) ? "bg-surface-hover text-text-primary" : "text-text-muted hover:bg-surface-hover/60 hover:text-text-primary"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>

      <div className="my-3 border-t border-border-default/60" />

      <FolderList />

      <div className="my-3 border-t border-border-default/60" />

      <TagList />

      <div className="flex-1" />
    </nav>
  );
}
