"use client";

import { useCallback, useEffect, useState } from "react";
import type { NoteFolder } from "../types";
import * as api from "../services/notesApi";

function byName(a: NoteFolder, b: NoteFolder) {
  return a.name.localeCompare(b.name);
}

/**
 * Owns the user's note folders plus create/rename/delete mutations, so the
 * sidebar's folder counts stay in sync wherever a note is filed or unfiled.
 */
export function useFolders() {
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.listNoteFolders();
      setFolders([...response.folders].sort(byName));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load folders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createFolder = useCallback(async (name: string, parentId?: string | null) => {
    const response = await api.createNoteFolder(name, parentId);
    setFolders((current) => [...current, response.folder].sort(byName));
    return response.folder;
  }, []);

  const renameFolder = useCallback(async (folderId: string, name: string) => {
    const response = await api.updateNoteFolder(folderId, { name });
    setFolders((current) => current.map((folder) => (folder.id === folderId ? response.folder : folder)).sort(byName));
    return response.folder;
  }, []);

  const removeFolder = useCallback(async (folderId: string) => {
    await api.deleteNoteFolder(folderId);
    setFolders((current) => current.filter((folder) => folder.id !== folderId));
  }, []);

  const adjustNoteCount = useCallback((folderId: string | null, delta: number) => {
    if (!folderId) return;
    setFolders((current) =>
      current.map((folder) =>
        folder.id === folderId
          ? { ...folder, note_count: Math.max(0, (folder.note_count || 0) + delta) }
          : folder
      )
    );
  }, []);

  return { folders, loading, error, refetch, createFolder, renameFolder, removeFolder, adjustNoteCount };
}
