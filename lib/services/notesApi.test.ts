import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createNote,
  listNotes,
  permanentlyDeleteNote,
  updateNote,
} from "./notesApi";

describe("notesApi", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("sends auth headers and serializes list filters", async () => {
    localStorage.setItem("authToken", "token-1");
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ notes: [], next_cursor: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await listNotes({
      search: "react hooks",
      folderId: "folder-1",
      tagId: "tag-1",
      favorite: true,
      pinned: true,
      archived: false,
      trash: true,
      sort: "createdAt",
      limit: 20,
      cursor: "cursor-1",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/notes?search=react+hooks&folderId=folder-1&tagId=tag-1&favorite=true&pinned=true&archived=false&trash=true&sort=createdAt&limit=20&cursor=cursor-1",
      { headers: { Authorization: "Bearer token-1" } },
    );
  });

  it("sends note mutation payloads as JSON", async () => {
    localStorage.setItem("authToken", "token-1");
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          note: {
            id: "note-1",
            title: "Updated",
            content_json: { type: "doc", content: [] },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await updateNote("note-1", {
      title: "Updated",
      is_favorite: true,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/notes/note-1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-1",
      },
      body: JSON.stringify({ title: "Updated", is_favorite: true }),
    });
  });

  it("throws API error messages from failed responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "Note not found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(permanentlyDeleteNote("missing")).rejects.toMatchObject({
      message: "Note not found.",
      status: 404,
    });
  });

  it("creates notes without requiring a payload", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ note: { id: "note-1" } }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createNote();

    expect(fetchMock).toHaveBeenCalledWith("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  });
});
