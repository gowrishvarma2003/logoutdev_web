"use client";

import { useEffect, useRef, useState } from "react";
import { PlusIcon, XIcon } from "@/components/ui/Icons";
import { useNotesWorkspace } from "./NotesWorkspaceContext";
import type { NoteTag } from "@/lib/types";

interface NoteTagPickerProps {
  selectedTags: NoteTag[];
  onChange: (tagIds: string[]) => Promise<void>;
}

/** Small inline tag chip row + "Tag" picker used in the note editor header. */
export default function NoteTagPicker({ selectedTags, onChange }: NoteTagPickerProps) {
  const { tags } = useNotesWorkspace();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const selectedIds = new Set(selectedTags.map((tag) => tag.id));

  async function toggleTag(tagId: string) {
    if (busy) return;
    setBusy(true);
    try {
      const next = selectedIds.has(tagId)
        ? selectedTags.filter((tag) => tag.id !== tagId).map((tag) => tag.id)
        : [...selectedTags.map((tag) => tag.id), tagId];
      await onChange(next);
      tags.refetch();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" ref={containerRef}>
      {selectedTags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => toggleTag(tag.id)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-rose-800 hover:text-rose-300 disabled:opacity-60"
          title="Remove tag"
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color || "#71717a" }} />
          {tag.name}
          <XIcon className="h-2.5 w-2.5" />
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border-strong px-2.5 py-1 text-xs text-text-disabled transition-colors hover:border-zinc-500 hover:text-text-secondary"
        >
          <PlusIcon className="h-3 w-3" /> Tag
        </button>
        {open ? (
          <div className="absolute left-0 top-full z-30 mt-1 max-h-56 w-48 overflow-y-auto rounded-xl border border-border-default bg-surface p-1.5 shadow-2xl">
            {tags.tags.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-text-disabled">No tags yet. Create one from the sidebar.</p>
            ) : (
              tags.tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-text-secondary transition-colors hover:bg-surface-hover"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color || "#71717a" }} />
                  <span className="flex-1 truncate">{tag.name}</span>
                  {selectedIds.has(tag.id) ? <span className="text-emerald-400">✓</span> : null}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
