"use client";

import EmptyState from "@/components/ui/EmptyState";
import { DocumentTextIcon, SearchIcon, TrashIcon, FolderIcon, TagIcon, ArchiveBoxIcon } from "@/components/ui/Icons";

type EmptyNotesVariant = "no-notes" | "no-results" | "trash-empty" | "folder-empty" | "tag-empty" | "archived-empty";

interface EmptyNotesStateProps {
  variant: EmptyNotesVariant;
  onCreateNote?: () => void;
}

const CONTENT: Record<EmptyNotesVariant, { icon: React.ReactNode; title: string; description: string }> = {
  "no-notes": {
    icon: <DocumentTextIcon className="h-7 w-7" />,
    title: "No notes yet",
    description: "Capture ideas, meeting notes, or technical docs. Your first note is one click away.",
  },
  "no-results": {
    icon: <SearchIcon className="h-7 w-7" />,
    title: "No matching notes",
    description: "Try a different search term, or clear filters to see more notes.",
  },
  "trash-empty": {
    icon: <TrashIcon className="h-7 w-7" />,
    title: "Trash is empty",
    description: "Deleted notes show up here so you can restore or permanently delete them.",
  },
  "folder-empty": {
    icon: <FolderIcon className="h-7 w-7" />,
    title: "This folder is empty",
    description: "Move a note here from its menu, or create a new one directly in this folder.",
  },
  "tag-empty": {
    icon: <TagIcon className="h-7 w-7" />,
    title: "No notes with this tag",
    description: "Tag a note from the editor to see it show up here.",
  },
  "archived-empty": {
    icon: <ArchiveBoxIcon className="h-7 w-7" />,
    title: "No archived notes",
    description: "Archived notes are hidden from your main list but never lost.",
  },
};

export default function EmptyNotesState({ variant, onCreateNote }: EmptyNotesStateProps) {
  const content = CONTENT[variant];
  const showAction = Boolean(onCreateNote) && (variant === "no-notes" || variant === "folder-empty");

  return (
    <div className="py-6">
      <EmptyState
        icon={content.icon}
        title={content.title}
        description={content.description}
        tone="default"
        action={
          showAction ? (
            <button
              onClick={onCreateNote}
              className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              New note
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
