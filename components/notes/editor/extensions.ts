import StarterKit from "@tiptap/starter-kit";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import { Placeholder, CharacterCount } from "@tiptap/extensions";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";

const lowlight = createLowlight(common);

/**
 * Shared Tiptap extension set for the notes editor. Content is authored as
 * structured JSON (see NoteContentDoc) — HTML is only used as the DOM
 * rendering target, never as the source of truth.
 */
export function createNoteEditorExtensions(placeholder = "Start writing, or press '/' for commands…") {
  return [
    StarterKit.configure({
      // CodeBlockLowlight replaces the plain code block with syntax highlighting.
      codeBlock: false,
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
          class: "note-link",
        },
      },
    }),
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: { class: "note-code-block" },
    }),
    TaskList.configure({ HTMLAttributes: { class: "note-task-list" } }),
    TaskItem.configure({ nested: true }),
    Placeholder.configure({ placeholder }),
    CharacterCount,
  ];
}
