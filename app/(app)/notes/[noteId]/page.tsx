"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useNote } from "@/lib/hooks/useNotes";
import { useNoteAutosave, readNoteDraft } from "@/lib/hooks/useNoteAutosave";
import { useToast } from "@/lib/hooks/useToast";
import NoteEditor from "@/components/notes/editor/NoteEditor";
import NoteTitleInput from "@/components/notes/NoteTitleInput";
import NoteMetaBar from "@/components/notes/NoteMetaBar";
import NoteTagPicker from "@/components/notes/NoteTagPicker";
import SaveStatusIndicator from "@/components/notes/SaveStatusIndicator";
import NoteMoreMenu from "@/components/notes/NoteMoreMenu";
import RichProductivityDialog from "@/components/productivity/RichProductivityDialog";
import Button from "@/components/ui/Button";
import { useNotesWorkspace } from "@/components/notes/NotesWorkspaceContext";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import { updateNote as apiUpdateNote } from "@/lib/services/notesApi";
import { formatRelativeTime } from "@/lib/utils";
import {
  DocumentTextIcon,
  LockIcon,
  UsersIcon,
  GlobeIcon,
} from "@/components/ui/Icons";
import type { NoteContentDoc } from "@/lib/types";

export default function NoteEditorPage() {
  const params = useParams<{ noteId: string }>();
  const noteId = params.noteId;
  const router = useRouter();
  const { showToast } = useToast();
  const { tags } = useNotesWorkspace();
  const { note, loading, error, notFound, setNote } = useNote(noteId);

  const [title, setTitle] = useState("");
  const [initialContent, setInitialContent] = useState<NoteContentDoc | null>(
    null,
  );
  const [productivityOpen, setProductivityOpen] = useState(false);
  const hydratedForRef = useRef<string | null>(null);

  const autosave = useNoteAutosave({
    noteId,
    onSaved: (updated) => {
      setNote((current) => (current ? { ...current, ...updated } : updated));
    },
  });

  useEffect(() => {
    if (!note || hydratedForRef.current === note.id) return;
    hydratedForRef.current = note.id;

    const draft = readNoteDraft(note.id);
    if (draft) {
      setTitle(draft.title);
      setInitialContent(draft.content);
      autosave.restoreDraft({ title: draft.title, content: draft.content, version: draft.baseVersion ?? note.version });
      showToast("Restored unsaved changes", {
        description:
          "We picked up where you left off before your last save completed.",
      });
    } else {
      setTitle(note.title);
      setInitialContent(note.content_json);
      autosave.hydrate({ title: note.title, content: note.content_json, version: note.version });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  function handleTitleChange(nextTitle: string) {
    setTitle(nextTitle);
    autosave.notifyChange({ title: nextTitle });
  }

  function handleContentChange(content: NoteContentDoc) {
    autosave.notifyChange({ content });
  }

  async function handleIconChange(icon: string | null) {
    if (!note) return;
    try {
      const { note: updated } = await apiUpdateNote(note.id, { icon });
      setNote((current) => (current ? { ...current, ...updated } : updated));
    } catch (error) {
      showToast("Couldn't update note icon", {
        tone: "error",
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    }
  }

  async function handleCoverChange(cover: string | null) {
    if (!note) return;
    try {
      const { note: updated } = await apiUpdateNote(note.id, { cover });
      setNote((current) => (current ? { ...current, ...updated } : updated));
    } catch (error) {
      showToast("Couldn't update note cover", {
        tone: "error",
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    }
  }

  async function handleTagsChange(tagIds: string[]) {
    if (!note) return;
    try {
      const { note: updated } = await apiUpdateNote(note.id, { tag_ids: tagIds });
      setNote((current) => (current ? { ...current, ...updated } : updated));
      void tags.refetch();
    } catch (error) {
      showToast("Couldn't update note tags", {
        tone: "error",
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
    }
  }

  if (notFound) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <EmptyState
          icon={<DocumentTextIcon className="h-7 w-7" />}
          title="Note not found"
          description="This note doesn't exist, was permanently deleted, or you don't have access to it."
          action={
            <button
              onClick={() => router.push("/productivity/notes")}
              className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Back to Notes
            </button>
          }
        />
      </div>
    );
  }

  if (loading || !note || initialContent === null) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-20 text-center text-sm text-rose-300">
        {error}
      </div>
    );
  }

  const visibilityIcon =
    note.visibility === "public" ? (
      <GlobeIcon className="h-3.5 w-3.5" />
    ) : note.visibility === "space" ? (
      <UsersIcon className="h-3.5 w-3.5" />
    ) : (
      <LockIcon className="h-3.5 w-3.5" />
    );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6 sm:px-6">
      {note.deleted_at ? (
        <div className="mb-4 rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
          This note is in Trash. Restore it from the menu to keep editing.
        </div>
      ) : null}

      <NoteMetaBar
        icon={note.icon}
        cover={note.cover}
        onChangeIcon={handleIconChange}
        onChangeCover={handleCoverChange}
      />

      <div className="mb-2 flex items-start justify-between gap-3">
        <NoteTitleInput
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled"
        />
        <div className="flex shrink-0 items-center gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={() => setProductivityOpen(true)} disabled={Boolean(note.deleted_at)}>
            Add to Productivity
          </Button>
          <NoteMoreMenu
            note={note}
            context="editor"
            onChanged={({ note: updated, navigateHome }) => {
              if (updated)
                setNote((current) =>
                  current ? { ...current, ...updated } : updated,
                );
              if (navigateHome) router.push("/productivity/notes");
            }}
          />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-disabled">
        <SaveStatusIndicator
          status={autosave.status}
          lastSavedAt={autosave.lastSavedAt || note.updated_at}
          onRetry={autosave.retry}
        />
        <span className="inline-flex items-center gap-1 capitalize">
          {visibilityIcon}
          {note.visibility}
        </span>
        <span>Updated {formatRelativeTime(note.updated_at)}</span>
      </div>

      {autosave.isConflict ? (
        <div className="mb-5 rounded-xl border border-amber-800/50 bg-amber-950/30 px-3.5 py-3 text-sm text-amber-100" role="alert">
          {autosave.error} Reloading will keep the server version; copy your local text first if you want to merge it.
        </div>
      ) : null}

      <div className="mb-6">
        <NoteTagPicker selectedTags={note.tags} onChange={handleTagsChange} />
      </div>

      <NoteEditor
        key={note.id}
        initialContent={initialContent}
        editable={!note.deleted_at}
        onChange={(content) => handleContentChange(content)}
        placeholder="Start writing, or press '/' for commands…"
      />
      <RichProductivityDialog
        open={productivityOpen}
        onClose={() => setProductivityOpen(false)}
        initialKind="task"
        defaultTitle={title || note.title || "Untitled note follow-up"}
        defaultDescription={note.excerpt || ""}
        defaultRelation={{ target_type: "note", target_id: note.id }}
        onCreated={() => {
          showToast("Added to Productivity", { description: "The new item is linked back to this note." });
        }}
      />
    </div>
  );
}
