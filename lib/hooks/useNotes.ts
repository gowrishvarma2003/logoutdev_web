"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Note, NoteListItem } from "../types";
import * as api from "../services/notesApi";
import type { NoteListFilters, NoteUpsertPayload } from "../services/notesApi";

/**
 * Lists a page of notes (metadata + excerpt only) for the given filters,
 * with cursor-based "load more" pagination.
 */
export function useNotes(filters: NoteListFilters) {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filterKey = JSON.stringify(filters);
  const requestIdRef = useRef(0);

  const load = useCallback(
    async (cursor?: string | null) => {
      const requestId = ++requestIdRef.current;
      const isInitial = !cursor;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const response = await api.listNotes({
          ...filters,
          cursor: cursor || undefined,
        });
        if (requestIdRef.current !== requestId) return;
        setNotes((current) =>
          isInitial ? response.notes : [...current, ...response.notes],
        );
        setNextCursor(response.next_cursor);
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        setError(err instanceof Error ? err.message : "Failed to load notes.");
      } finally {
        if (requestIdRef.current === requestId) {
          if (isInitial) setLoading(false);
          else setLoadingMore(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey],
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const loadMore = useCallback(() => {
    if (nextCursor && !loadingMore) load(nextCursor);
  }, [load, nextCursor, loadingMore]);

  const refetch = useCallback(() => load(), [load]);

  /** Optimistically patch/remove a note in the current page without a refetch. */
  const patchNote = useCallback(
    (noteId: string, patch: Partial<NoteListItem> | null) => {
      setNotes((current) => {
        if (patch === null) return current.filter((note) => note.id !== noteId);
        return current.map((note) =>
          note.id === noteId ? { ...note, ...patch } : note,
        );
      });
    },
    [],
  );

  return {
    notes,
    nextCursor,
    loading,
    loadingMore,
    error,
    loadMore,
    refetch,
    patchNote,
  };
}

/** Fetches a single full note (including content) for the editor view. */
export function useNote(noteId: string | null | undefined) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!noteId) {
      setNote(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const response = await api.getNote(noteId);
      setNote(response.note);
    } catch (err) {
      const status = (err as { status?: number } | undefined)?.status;
      if (status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load note.");
      }
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    load();
  }, [load]);

  return { note, setNote, loading, error, notFound, refetch: load };
}

export function useCreateNote() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (payload: NoteUpsertPayload = {}) => {
    setCreating(true);
    setError(null);
    try {
      const response = await api.createNote(payload);
      return response.note;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create note.";
      setError(message);
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  return { createNote: create, creating, error };
}

export function useUpdateNote() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (noteId: string, payload: NoteUpsertPayload) => {
      setUpdating(true);
      setError(null);
      try {
        const response = await api.updateNote(noteId, payload);
        return response.note;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update note.";
        setError(message);
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    [],
  );

  return { updateNote: update, updating, error };
}

export function useDeleteNote() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (noteId: string) => {
    setDeleting(true);
    setError(null);
    try {
      const response = await api.trashNote(noteId);
      return response.note;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to move note to Trash.";
      setError(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, []);

  return { deleteNote: remove, deleting, error };
}
