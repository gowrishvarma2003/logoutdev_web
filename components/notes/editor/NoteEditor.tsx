"use client";

import { forwardRef, useImperativeHandle } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { NoteContentDoc } from "@/lib/types";
import { createNoteEditorExtensions } from "./extensions";
import NoteToolbar from "./NoteToolbar";

export interface NoteEditorHandle {
  focus: () => void;
  getPlainText: () => string;
}

interface NoteEditorProps {
  initialContent: NoteContentDoc;
  editable?: boolean;
  placeholder?: string;
  onChange: (content: NoteContentDoc, plainText: string) => void;
  className?: string;
}

/**
 * Thin wrapper around Tiptap. Render with `key={note.id}` from the parent so
 * switching notes remounts the editor with fresh initial content — Tiptap's
 * `content` option is only read on mount, not on every re-render.
 */
const NoteEditor = forwardRef<NoteEditorHandle, NoteEditorProps>(
  function NoteEditor(
    { initialContent, editable = true, placeholder, onChange, className = "" },
    ref,
  ) {
    const editor = useEditor({
      extensions: createNoteEditorExtensions(placeholder),
      content: initialContent,
      editable,
      immediatelyRender: false,
      // Tiptap manages its own DOM; the toolbar subscribes independently via
      // useEditorState, so the outer component doesn't need to re-render on
      // every keystroke.
      shouldRerenderOnTransaction: false,
      onUpdate: ({ editor: instance }) => {
        onChange(instance.getJSON() as NoteContentDoc, instance.getText());
      },
      editorProps: {
        attributes: {
          class: "note-prose",
          spellcheck: "true",
        },
      },
    });

    useImperativeHandle(
      ref,
      () => ({
        focus: () => {
          editor?.chain().focus().run();
        },
        getPlainText: () => editor?.getText() ?? "",
      }),
      [editor],
    );

    // `useEditor` already destroys the editor on unmount (with the correct
    // React 19 Strict Mode double-invoke handling), so no manual cleanup here.

    return (
      <div className={className}>
        {editor ? <NoteToolbar editor={editor} /> : null}
        <EditorContent editor={editor} />
      </div>
    );
  },
);

export default NoteEditor;
