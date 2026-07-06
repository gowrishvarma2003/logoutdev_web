import { API_BASE_URL } from "../apiBaseUrl";
import type {
  Note,
  NoteContentDoc,
  NoteFolder,
  NoteListResponse,
  NoteTag,
  NoteVisibility,
} from "../types";

const API = API_BASE_URL;

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleRes<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : "Request failed";
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }
  return data as T;
}

export interface NoteListFilters {
  search?: string;
  folderId?: string | null;
  tagId?: string | null;
  favorite?: boolean;
  pinned?: boolean;
  archived?: boolean;
  trash?: boolean;
  sort?: "updatedAt" | "createdAt" | "title";
  limit?: number;
  cursor?: string | null;
}

export interface NoteUpsertPayload {
  title?: string;
  content?: NoteContentDoc;
  icon?: string | null;
  cover?: string | null;
  visibility?: NoteVisibility;
  folder_id?: string | null;
  tag_ids?: string[];
  is_favorite?: boolean;
  is_pinned?: boolean;
  is_archived?: boolean;
}

function buildQuery(filters: NoteListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.folderId) params.set("folderId", filters.folderId);
  if (filters.tagId) params.set("tagId", filters.tagId);
  if (filters.favorite) params.set("favorite", "true");
  if (filters.pinned) params.set("pinned", "true");
  if (filters.archived !== undefined) params.set("archived", String(filters.archived));
  if (filters.trash) params.set("trash", "true");
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.cursor) params.set("cursor", filters.cursor);
  return params.toString();
}

export async function listNotes(filters: NoteListFilters = {}) {
  const qs = buildQuery(filters);
  const res = await fetch(`${API}/api/notes${qs ? `?${qs}` : ""}`, {
    headers: { ...authHeaders() },
  });
  return handleRes<NoteListResponse>(res);
}

export async function getNote(noteId: string) {
  const res = await fetch(`${API}/api/notes/${noteId}`, {
    headers: { ...authHeaders() },
  });
  return handleRes<{ note: Note }>(res);
}

export async function createNote(payload: NoteUpsertPayload = {}) {
  const res = await fetch(`${API}/api/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleRes<{ note: Note }>(res);
}

export async function updateNote(noteId: string, payload: NoteUpsertPayload) {
  const res = await fetch(`${API}/api/notes/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleRes<{ note: Note }>(res);
}

export async function trashNote(noteId: string) {
  const res = await fetch(`${API}/api/notes/${noteId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes<{ note: Note }>(res);
}

export async function restoreNote(noteId: string) {
  const res = await fetch(`${API}/api/notes/${noteId}/restore`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes<{ note: Note }>(res);
}

export async function permanentlyDeleteNote(noteId: string) {
  const res = await fetch(`${API}/api/notes/${noteId}/permanent`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes<{ id: string; deleted: boolean }>(res);
}

export async function duplicateNote(noteId: string) {
  const res = await fetch(`${API}/api/notes/${noteId}/duplicate`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleRes<{ note: Note }>(res);
}

// ─── Folders ────────────────────────────────────────────────────────────────

export async function listNoteFolders() {
  const res = await fetch(`${API}/api/notes/folders`, {
    headers: { ...authHeaders() },
  });
  return handleRes<{ folders: NoteFolder[] }>(res);
}

export async function createNoteFolder(name: string, parentId?: string | null) {
  const res = await fetch(`${API}/api/notes/folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, parent_id: parentId ?? null }),
  });
  return handleRes<{ folder: NoteFolder }>(res);
}

export async function updateNoteFolder(
  folderId: string,
  payload: { name?: string; parent_id?: string | null }
) {
  const res = await fetch(`${API}/api/notes/folders/${folderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleRes<{ folder: NoteFolder }>(res);
}

export async function deleteNoteFolder(folderId: string) {
  const res = await fetch(`${API}/api/notes/folders/${folderId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes<{ id: string; deleted: boolean }>(res);
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export async function listNoteTags() {
  const res = await fetch(`${API}/api/notes/tags`, {
    headers: { ...authHeaders() },
  });
  return handleRes<{ tags: NoteTag[] }>(res);
}

export async function createNoteTag(name: string, color?: string | null) {
  const res = await fetch(`${API}/api/notes/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, color: color ?? null }),
  });
  return handleRes<{ tag: NoteTag }>(res);
}

export async function updateNoteTag(
  tagId: string,
  payload: { name?: string; color?: string | null }
) {
  const res = await fetch(`${API}/api/notes/tags/${tagId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleRes<{ tag: NoteTag }>(res);
}

export async function deleteNoteTag(tagId: string) {
  const res = await fetch(`${API}/api/notes/tags/${tagId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleRes<{ id: string; deleted: boolean }>(res);
}
