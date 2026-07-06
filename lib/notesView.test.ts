import { describe, expect, it } from "vitest";
import { buildNoteListFilters, notesViewHref, parseNotesView } from "./notesView";

describe("notesView", () => {
  it("parses notes URL state and builds API filters", () => {
    const parsed = parseNotesView(new URLSearchParams("view=favorites&q=react"));

    expect(parsed).toEqual({
      view: "favorites",
      folderId: null,
      tagId: null,
      search: "react",
    });
    expect(buildNoteListFilters(parsed)).toEqual({
      favorite: true,
      search: "react",
    });
  });

  it("lets folder and tag filters take precedence over view filters", () => {
    expect(
      buildNoteListFilters(
        parseNotesView(new URLSearchParams("view=trash&folder=folder-1&q=api")),
      ),
    ).toEqual({ folderId: "folder-1", search: "api" });

    expect(
      buildNoteListFilters(
        parseNotesView(new URLSearchParams("view=pinned&tag=tag-1")),
      ),
    ).toEqual({ tagId: "tag-1" });
  });

  it("builds stable notes hrefs", () => {
    expect(notesViewHref({ view: "all" })).toBe("/notes");
    expect(notesViewHref({ view: "trash" })).toBe("/notes?view=trash");
    expect(notesViewHref({ folder: "folder-1" })).toBe("/notes?folder=folder-1");
    expect(notesViewHref({ tag: "tag-1" })).toBe("/notes?tag=tag-1");
  });
});
