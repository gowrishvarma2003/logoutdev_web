import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  discardNoteDraft,
  readNoteDraft,
  useNoteAutosave,
} from "./useNoteAutosave";
import { updateNote } from "../services/notesApi";
import type { Note, NoteContentDoc } from "../types";

vi.mock("../services/notesApi", () => ({
  updateNote: vi.fn(),
}));

const content: NoteContentDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Hello notes" }],
    },
  ],
};

function noteResponse(overrides: Partial<Note> = {}): { note: Note } {
  return {
    note: {
      id: "note-1",
      folder_id: null,
      title: "Saved",
      excerpt: "Hello notes",
      icon: null,
      cover: null,
      is_favorite: false,
      is_pinned: false,
      is_archived: false,
      visibility: "private",
      last_opened_at: null,
      deleted_at: null,
      created_at: "2026-07-06T00:00:00.000Z",
      updated_at: "2026-07-06T00:00:01.000Z",
      version: 2,
      folder: null,
      tags: [],
      content_json: content,
      content_text: "Hello notes",
      ...overrides,
    },
  };
}

describe("useNoteAutosave", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.mocked(updateNote).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes a local draft immediately and clears it after a successful save", async () => {
    vi.mocked(updateNote).mockResolvedValue(noteResponse());
    const onSaved = vi.fn();
    const { result } = renderHook(() =>
      useNoteAutosave({ noteId: "note-1", debounceMs: 50, onSaved }),
    );

    act(() => {
      result.current.hydrate({ title: "Initial", content, version: 1 });
      result.current.notifyChange({ title: "Saved" });
    });

    expect(readNoteDraft("note-1")?.title).toBe("Saved");
    expect(result.current.status).toBe("unsaved");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.status).toBe("saved");
    expect(updateNote).toHaveBeenCalledWith("note-1", {
      title: "Saved",
      content,
      expected_version: 1,
    });
    expect(readNoteDraft("note-1")).toBeNull();
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: "note-1" }));
  });

  it("keeps the draft after a failed save and retries the latest content", async () => {
    vi.mocked(updateNote)
      .mockRejectedValueOnce(new Error("Network down"))
      .mockResolvedValueOnce(noteResponse({ title: "Retry" }));

    const { result } = renderHook(() =>
      useNoteAutosave({ noteId: "note-1", debounceMs: 50 }),
    );

    act(() => {
      result.current.hydrate({ title: "Initial", content, version: 1 });
      result.current.notifyChange({ title: "Retry" });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.status).toBe("error");
    expect(readNoteDraft("note-1")?.title).toBe("Retry");

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.status).toBe("saved");
    expect(readNoteDraft("note-1")).toBeNull();
  });

  it("discards drafts explicitly", () => {
    localStorage.setItem(
      "logoutdev.notes.draft.note-1",
      JSON.stringify({ title: "Draft", content, savedAt: new Date().toISOString() }),
    );

    discardNoteDraft("note-1");

    expect(readNoteDraft("note-1")).toBeNull();
  });

  it("retains a conflict draft instead of retrying over a newer note", async () => {
    const conflict = Object.assign(new Error("Conflict"), { status: 409 });
    vi.mocked(updateNote).mockRejectedValueOnce(conflict);
    const { result } = renderHook(() =>
      useNoteAutosave({ noteId: "note-1", debounceMs: 50 }),
    );

    act(() => {
      result.current.hydrate({ title: "Initial", content, version: 1 });
      result.current.notifyChange({ title: "Local edit" });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(result.current.status).toBe("conflict");
    expect(readNoteDraft("note-1")?.title).toBe("Local edit");
    expect(updateNote).toHaveBeenCalledWith("note-1", expect.objectContaining({ expected_version: 1 }));
  });
});
