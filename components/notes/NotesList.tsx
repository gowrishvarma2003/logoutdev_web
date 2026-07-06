"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useNotes, useCreateNote } from "@/lib/hooks/useNotes";
import { useNotesWorkspace } from "./NotesWorkspaceContext";
import NoteListItem from "./NoteListItem";
import EmptyNotesState from "./EmptyNotesState";
import Spinner from "@/components/ui/Spinner";
import { PlusIcon } from "@/components/ui/Icons";
import {
  parseNotesView,
  buildNoteListFilters,
  type ParsedNotesView,
} from "@/lib/notesView";
import type { NoteFolder, NoteTag } from "@/lib/types";

function resolveViewTitle(
  parsed: ParsedNotesView,
  folders: NoteFolder[],
  tags: NoteTag[],
) {
  if (parsed.folderId)
    return (
      folders.find((folder) => folder.id === parsed.folderId)?.name || "Folder"
    );
  if (parsed.tagId)
    return tags.find((tag) => tag.id === parsed.tagId)?.name || "Tag";
  switch (parsed.view) {
    case "favorites":
      return "Favorites";
    case "pinned":
      return "Pinned";
    case "recent":
      return "Recent";
    case "archived":
      return "Archived";
    case "trash":
      return "Trash";
    default:
      return "All Notes";
  }
}

export default function NotesList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { folders, tags } = useNotesWorkspace();
  const { createNote, creating } = useCreateNote();

  const parsed = parseNotesView(searchParams);
  const filters = buildNoteListFilters(parsed);
  const {
    notes,
    loading,
    loadingMore,
    error,
    nextCursor,
    loadMore,
    patchNote,
  } = useNotes(filters);
  const title = resolveViewTitle(parsed, folders.folders, tags.tags);

  async function handleCreate() {
    const note = await createNote(
      parsed.folderId ? { folder_id: parsed.folderId } : {},
    );
    router.push(`/notes/${note.id}`);
  }

  function emptyVariant() {
    if (parsed.search) return "no-results" as const;
    if (parsed.tagId) return "tag-empty" as const;
    if (parsed.folderId) return "folder-empty" as const;
    if (parsed.view === "trash") return "trash-empty" as const;
    if (parsed.view === "archived") return "archived-empty" as const;
    return "no-notes" as const;
  }

  const variant = emptyVariant();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">
            {parsed.search ? `Search: "${parsed.search}"` : title}
          </h1>
          {!loading ? (
            <p className="mt-0.5 text-xs text-zinc-500">
              {notes.length} note{notes.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="hidden rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-60 sm:inline-flex"
        >
          New note
        </button>
      </div>

      {parsed.view === "trash" && notes.length > 0 ? (
        <p className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-xs text-zinc-400">
          Notes in Trash can be restored or permanently deleted from each
          note&apos;s menu.
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-19 animate-pulse rounded-xl bg-zinc-900/60"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 px-4 py-6 text-center text-sm text-rose-300">
          {error}
        </div>
      ) : notes.length === 0 ? (
        <EmptyNotesState
          variant={variant}
          onCreateNote={
            variant === "no-notes" || variant === "folder-empty"
              ? handleCreate
              : undefined
          }
        />
      ) : (
        <>
          <ul className="space-y-1">
            {notes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                onChanged={({ note: updated, removedFromView }) => {
                  if (removedFromView) patchNote(note.id, null);
                  else if (updated) patchNote(note.id, updated);
                }}
              />
            ))}
          </ul>
          {nextCursor ? (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 disabled:opacity-60"
              >
                {loadingMore ? <Spinner size="sm" /> : null}
                Load more
              </button>
            </div>
          ) : null}
        </>
      )}

      <button
        onClick={handleCreate}
        disabled={creating}
        aria-label="New note"
        className="fixed bottom-6 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-white text-zinc-950 shadow-2xl transition-transform hover:scale-105 disabled:opacity-60 sm:hidden"
      >
        <PlusIcon className="h-6 w-6" />
      </button>
    </div>
  );
}
