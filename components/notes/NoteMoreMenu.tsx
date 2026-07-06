"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DotsIcon,
  EditIcon,
  DuplicateIcon,
  StarIcon,
  PinIcon,
  PinSlashIcon,
  FolderIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  XCircleIcon,
} from "@/components/ui/Icons";
import { useUpdateNote } from "@/lib/hooks/useNotes";
import * as notesApi from "@/lib/services/notesApi";
import { useToast } from "@/lib/hooks/useToast";
import { useNotesWorkspace } from "./NotesWorkspaceContext";
import RenameNoteDialog from "./RenameNoteDialog";
import MoveNoteDialog from "./MoveNoteDialog";
import DeleteNoteDialog from "./DeleteNoteDialog";
import type { Note, NoteListItem } from "@/lib/types";

type MenuNote = Pick<
  NoteListItem,
  "id" | "title" | "folder_id" | "is_favorite" | "is_pinned" | "is_archived" | "deleted_at"
>;

export interface NoteMoreMenuChange {
  note?: Note;
  /** True when this note should disappear from whatever list is rendering it. */
  removedFromView?: boolean;
  /** True when the current page (the editor) should navigate back to /notes. */
  navigateHome?: boolean;
}

interface NoteMoreMenuProps {
  note: MenuNote;
  /** "editor" hides Rename (the title field already does that job there). */
  context?: "list" | "editor";
  align?: "left" | "right";
  onChanged?: (change: NoteMoreMenuChange) => void;
}

function MenuItem({
  icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
        tone === "danger" ? "text-rose-400 hover:bg-rose-500/10" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/**
 * Self-contained "more actions" menu for a note: owns the dropdown, the
 * rename/move/delete dialogs, and the mutation calls. Reused from both
 * note list rows and the editor page's toolbar.
 */
export default function NoteMoreMenu({ note, context = "list", align = "right", onChanged }: NoteMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"trash" | "permanent" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const { updateNote } = useUpdateNote();
  const { folders } = useNotesWorkspace();

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const isTrashed = Boolean(note.deleted_at);

  async function runAction(
    action: () => Promise<void>,
    errorMessage: string,
    options: { throwOnError?: boolean } = {},
  ) {
    try {
      await action();
    } catch (error) {
      showToast(errorMessage, {
        tone: "error",
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
      if (options.throwOnError) {
        throw error;
      }
    }
  }

  async function handleRename(title: string) {
    await runAction(async () => {
      const updated = await updateNote(note.id, { title });
      onChanged?.({ note: updated });
      showToast("Note renamed", { tone: "success" });
    }, "Couldn't rename note", { throwOnError: true });
  }

  async function handleDuplicate() {
    await runAction(async () => {
      const response = await notesApi.duplicateNote(note.id);
      showToast("Note duplicated", {
        tone: "success",
        action: { label: "Open copy", onClick: () => router.push(`/notes/${response.note.id}`) },
      });
    }, "Couldn't duplicate note");
  }

  async function handleToggleFavorite() {
    await runAction(async () => {
      const updated = await updateNote(note.id, { is_favorite: !note.is_favorite });
      onChanged?.({ note: updated });
    }, "Couldn't update favorite status");
  }

  async function handleTogglePinned() {
    await runAction(async () => {
      const updated = await updateNote(note.id, { is_pinned: !note.is_pinned });
      onChanged?.({ note: updated });
    }, "Couldn't update pinned status");
  }

  async function handleToggleArchived() {
    await runAction(async () => {
      const updated = await updateNote(note.id, { is_archived: !note.is_archived });
      onChanged?.({ note: updated, removedFromView: true });
      showToast(note.is_archived ? "Note unarchived" : "Note archived", { tone: "success" });
    }, note.is_archived ? "Couldn't unarchive note" : "Couldn't archive note");
  }

  async function handleMove(folderId: string | null) {
    await runAction(async () => {
      const previousFolderId = note.folder_id;
      const updated = await updateNote(note.id, { folder_id: folderId });
      folders.adjustNoteCount(previousFolderId, -1);
      folders.adjustNoteCount(folderId, 1);
      onChanged?.({ note: updated, removedFromView: true });
      showToast("Note moved", { tone: "success" });
    }, "Couldn't move note", { throwOnError: true });
  }

  async function handleTrash() {
    await runAction(async () => {
      const response = await notesApi.trashNote(note.id);
      folders.adjustNoteCount(note.folder_id, -1);
      onChanged?.({ note: response.note, removedFromView: true, navigateHome: context === "editor" });
      showToast("Moved to Trash", { tone: "success" });
    }, "Couldn't move note to Trash", { throwOnError: true });
  }

  async function handleRestore() {
    await runAction(async () => {
      const response = await notesApi.restoreNote(note.id);
      folders.adjustNoteCount(response.note.folder_id, 1);
      onChanged?.({ note: response.note, removedFromView: true });
      showToast("Note restored", { tone: "success" });
    }, "Couldn't restore note", { throwOnError: true });
  }

  async function handlePermanentDelete() {
    await runAction(async () => {
      await notesApi.permanentlyDeleteNote(note.id);
      onChanged?.({ removedFromView: true, navigateHome: context === "editor" });
      showToast("Note permanently deleted", { tone: "success" });
    }, "Couldn't permanently delete note", { throwOnError: true });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((value) => !value)}
        className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
        aria-label="More actions"
      >
        <DotsIcon className="h-4 w-4" />
      </button>

      {open ? (
        <div
          className={`absolute top-full z-30 mt-1 w-52 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-2xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {isTrashed ? (
            <>
              <MenuItem
                icon={<ArrowUturnLeftIcon className="h-4 w-4" />}
                label="Restore"
                onClick={() => {
                  setOpen(false);
                  handleRestore();
                }}
              />
              <div className="my-1 border-t border-zinc-800" />
              <MenuItem
                icon={<XCircleIcon className="h-4 w-4" />}
                label="Delete permanently"
                tone="danger"
                onClick={() => {
                  setOpen(false);
                  setDeleteMode("permanent");
                }}
              />
            </>
          ) : (
            <>
              {context === "list" ? (
                <MenuItem
                  icon={<EditIcon className="h-4 w-4" />}
                  label="Rename"
                  onClick={() => {
                    setOpen(false);
                    setRenameOpen(true);
                  }}
                />
              ) : null}
              <MenuItem
                icon={<DuplicateIcon className="h-4 w-4" />}
                label="Duplicate"
                onClick={() => {
                  setOpen(false);
                  handleDuplicate();
                }}
              />
              <MenuItem
                icon={<StarIcon className="h-4 w-4" filled={note.is_favorite} />}
                label={note.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                onClick={() => {
                  setOpen(false);
                  handleToggleFavorite();
                }}
              />
              <MenuItem
                icon={note.is_pinned ? <PinSlashIcon className="h-4 w-4" /> : <PinIcon className="h-4 w-4" />}
                label={note.is_pinned ? "Unpin" : "Pin"}
                onClick={() => {
                  setOpen(false);
                  handleTogglePinned();
                }}
              />
              <MenuItem
                icon={<FolderIcon className="h-4 w-4" />}
                label="Move to folder"
                onClick={() => {
                  setOpen(false);
                  setMoveOpen(true);
                }}
              />
              <MenuItem
                icon={<ArchiveBoxIcon className="h-4 w-4" />}
                label={note.is_archived ? "Unarchive" : "Archive"}
                onClick={() => {
                  setOpen(false);
                  handleToggleArchived();
                }}
              />
              <div className="my-1 border-t border-zinc-800" />
              <MenuItem
                icon={<TrashIcon className="h-4 w-4" />}
                label="Move to Trash"
                tone="danger"
                onClick={() => {
                  setOpen(false);
                  setDeleteMode("trash");
                }}
              />
            </>
          )}
        </div>
      ) : null}

      <RenameNoteDialog
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        initialTitle={note.title}
        onSubmit={handleRename}
      />
      <MoveNoteDialog
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        currentFolderId={note.folder_id}
        onSelect={handleMove}
      />
      <DeleteNoteDialog
        open={deleteMode !== null}
        mode={deleteMode || "trash"}
        noteTitle={note.title}
        onClose={() => setDeleteMode(null)}
        onConfirm={deleteMode === "permanent" ? handlePermanentDelete : handleTrash}
      />
    </div>
  );
}
