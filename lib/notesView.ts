import type { NoteListFilters } from "./services/notesApi";

export type NotesViewKey = "all" | "favorites" | "pinned" | "recent" | "archived" | "trash";

export const NOTES_VIEW_KEYS: NotesViewKey[] = ["all", "favorites", "pinned", "recent", "archived", "trash"];

export interface ParsedNotesView {
  view: NotesViewKey;
  folderId: string | null;
  tagId: string | null;
  search: string;
}

/** Reads the active notes view from the current URL search params. */
export function parseNotesView(searchParams: URLSearchParams): ParsedNotesView {
  const folderId = searchParams.get("folder");
  const tagId = searchParams.get("tag");
  const rawView = searchParams.get("view") || "all";
  const search = searchParams.get("q") || "";

  const view: NotesViewKey = NOTES_VIEW_KEYS.includes(rawView as NotesViewKey)
    ? (rawView as NotesViewKey)
    : "all";

  return { view, folderId, tagId, search };
}

/** Maps a parsed view into the query filters the notes API understands. */
export function buildNoteListFilters(parsed: ParsedNotesView): NoteListFilters {
  const filters: NoteListFilters = {};
  if (parsed.search.trim()) filters.search = parsed.search.trim();

  if (parsed.folderId) {
    filters.folderId = parsed.folderId;
    return filters;
  }
  if (parsed.tagId) {
    filters.tagId = parsed.tagId;
    return filters;
  }

  switch (parsed.view) {
    case "favorites":
      filters.favorite = true;
      break;
    case "pinned":
      filters.pinned = true;
      break;
    case "recent":
      filters.sort = "updatedAt";
      filters.limit = 10;
      break;
    case "archived":
      filters.archived = true;
      break;
    case "trash":
      filters.trash = true;
      break;
    default:
      break;
  }

  return filters;
}

export function notesViewHref(next: { view?: NotesViewKey; folder?: string; tag?: string }) {
  const params = new URLSearchParams();
  if (next.folder) {
    params.set("folder", next.folder);
  } else if (next.tag) {
    params.set("tag", next.tag);
  } else if (next.view && next.view !== "all") {
    params.set("view", next.view);
  }
  const qs = params.toString();
  return qs ? `/notes?${qs}` : "/notes";
}
