"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Note, NoteContentDoc, NoteSaveStatus } from "../types";
import { updateNote as apiUpdateNote } from "../services/notesApi";

interface NoteDraft {
  title: string;
  content: NoteContentDoc;
  savedAt: string;
  baseVersion?: number;
}

function draftKey(noteId: string) {
  return `logoutdev.notes.draft.${noteId}`;
}

/** Reads a locally-persisted unsaved draft for a note, if one exists. */
export function readNoteDraft(noteId: string): NoteDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(noteId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NoteDraft;
    if (typeof parsed?.title === "string" && parsed?.content) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function discardNoteDraft(noteId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftKey(noteId));
  } catch {
    // ignore — nothing meaningful to recover from here
  }
}

function writeDraft(noteId: string, draft: NoteDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(draftKey(noteId), JSON.stringify(draft));
  } catch {
    // Storage full or unavailable (e.g. private browsing) — the debounced
    // network save is still the primary save path.
  }
}

interface UseNoteAutosaveOptions {
  noteId: string;
  onSaved?: (note: Note) => void;
  debounceMs?: number;
}

interface LatestContent {
  title: string;
  content: NoteContentDoc;
  version?: number;
}

/**
 * Debounced autosave for a single note. Writes a local draft synchronously
 * on every change (so a refresh never loses content) and pushes the actual
 * save to the API after `debounceMs` of inactivity. Failed saves keep the
 * draft around and surface an "error" status so the UI can offer a retry.
 */
export function useNoteAutosave({
  noteId,
  onSaved,
  debounceMs = 1000,
}: UseNoteAutosaveOptions) {
  const [status, setStatus] = useState<NoteSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const latestRef = useRef<LatestContent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const pendingAfterSaveRef = useRef(false);
  const changeSequenceRef = useRef(0);
  const versionRef = useRef<number | null>(null);
  const statusRef = useRef<NoteSaveStatus>("idle");

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const save = useCallback(async () => {
    if (!latestRef.current) return;
    if (savingRef.current) {
      pendingAfterSaveRef.current = true;
      return;
    }

    savingRef.current = true;
    setStatus("saving");
    setError(null);
    const payload = latestRef.current;
    const saveSequence = changeSequenceRef.current;
    const expectedVersion = versionRef.current;

    try {
      const response = await apiUpdateNote(noteId, {
        title: payload.title,
        content: payload.content,
        ...(expectedVersion !== null ? { expected_version: expectedVersion } : {}),
      });
      const note = response.note;
      versionRef.current = note.version;
      setStatus("saved");
      setLastSavedAt(note.updated_at);
      // Do not erase recovery data written while this request was in flight.
      if (changeSequenceRef.current === saveSequence) discardNoteDraft(noteId);
      onSaved?.(note);
    } catch (err) {
      const status = (err as { status?: number } | undefined)?.status;
      const isConflict = status === 409;
      setStatus(isConflict ? "conflict" : "error");
      setError(isConflict
        ? "This note changed in another session. Your local draft is safe; reload the note before deciding what to keep."
        : err instanceof Error ? err.message : "Failed to save note.");
      writeDraft(noteId, { ...latestRef.current, savedAt: new Date().toISOString(), baseVersion: versionRef.current ?? undefined });
    } finally {
      savingRef.current = false;
      if (pendingAfterSaveRef.current) {
        pendingAfterSaveRef.current = false;
        save();
      }
    }
  }, [noteId, onSaved]);

  const saveRef = useRef(save);
  saveRef.current = save;

  const scheduleSave = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      saveRef.current();
    }, debounceMs);
  }, [clearTimer, debounceMs]);

  /** Seeds the "last known" content without marking anything dirty. */
  const hydrate = useCallback((initial: LatestContent) => {
    latestRef.current = initial;
    versionRef.current = initial.version ?? null;
  }, []);

  /** Seeds content from a restored draft and saves it right away. */
  const restoreDraft = useCallback(
    (initial: LatestContent) => {
      latestRef.current = initial;
      versionRef.current = initial.version ?? null;
      setStatus("unsaved");
      scheduleSave();
    },
    [scheduleSave],
  );

  const notifyChange = useCallback(
    (update: Partial<LatestContent>) => {
      const current = latestRef.current || {
        title: "",
        content: { type: "doc", content: [] } as NoteContentDoc,
      };
      const next: LatestContent = {
        title: update.title !== undefined ? update.title : current.title,
        content:
          update.content !== undefined ? update.content : current.content,
      };
      latestRef.current = next;
      changeSequenceRef.current += 1;
      setStatus("unsaved");
      writeDraft(noteId, { ...next, savedAt: new Date().toISOString(), baseVersion: versionRef.current ?? undefined });
      scheduleSave();
    },
    [noteId, scheduleSave],
  );

  const flush = useCallback(() => {
    clearTimer();
    return saveRef.current();
  }, [clearTimer]);

  const retry = useCallback(() => {
    return flush();
  }, [flush]);

  // Best-effort final save when switching notes or leaving the page.
  useEffect(() => {
    function handleVisibilityChange() {
      if (
        document.visibilityState === "hidden" &&
        (statusRef.current === "unsaved" || statusRef.current === "error")
      ) {
        clearTimer();
        saveRef.current();
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
      if (
        latestRef.current &&
        (statusRef.current === "unsaved" || statusRef.current === "error")
      ) {
        saveRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  return {
    status,
    lastSavedAt,
    setLastSavedAt,
    error,
    isConflict: status === "conflict",
    notifyChange,
    hydrate,
    restoreDraft,
    flush,
    retry,
  };
}
