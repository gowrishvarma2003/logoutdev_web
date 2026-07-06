"use client";

import { useCallback, useEffect, useState } from "react";
import type { NoteTag } from "../types";
import * as api from "../services/notesApi";

function byName(a: NoteTag, b: NoteTag) {
  return a.name.localeCompare(b.name);
}

/** Owns the user's note tags plus create/rename/recolor/delete mutations. */
export function useTags() {
  const [tags, setTags] = useState<NoteTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.listNoteTags();
      setTags([...response.tags].sort(byName));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tags.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createTag = useCallback(async (name: string, color?: string | null) => {
    const response = await api.createNoteTag(name, color);
    setTags((current) => [...current, response.tag].sort(byName));
    return response.tag;
  }, []);

  const renameTag = useCallback(async (tagId: string, payload: { name?: string; color?: string | null }) => {
    const response = await api.updateNoteTag(tagId, payload);
    setTags((current) => current.map((tag) => (tag.id === tagId ? { ...tag, ...response.tag } : tag)).sort(byName));
    return response.tag;
  }, []);

  const removeTag = useCallback(async (tagId: string) => {
    await api.deleteNoteTag(tagId);
    setTags((current) => current.filter((tag) => tag.id !== tagId));
  }, []);

  return { tags, loading, error, refetch, createTag, renameTag, removeTag };
}
