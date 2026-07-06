"use client";

import { useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  CodeBracketIcon,
  ListIcon,
  ListNumberedIcon,
  TaskListIcon,
  QuoteIcon,
  MinusIcon,
  LinkIcon,
  UndoIcon,
  RedoIcon,
} from "@/components/ui/Icons";
import LinkPopover from "./LinkPopover";

function ToolbarButton({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 transition-colors ${
        active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/70 hover:text-white"
      } disabled:pointer-events-none disabled:opacity-30`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-zinc-800" aria-hidden="true" />;
}

export default function NoteToolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);

  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor.isActive("bold"),
      italic: ctx.editor.isActive("italic"),
      strike: ctx.editor.isActive("strike"),
      code: ctx.editor.isActive("code"),
      h1: ctx.editor.isActive("heading", { level: 1 }),
      h2: ctx.editor.isActive("heading", { level: 2 }),
      h3: ctx.editor.isActive("heading", { level: 3 }),
      bulletList: ctx.editor.isActive("bulletList"),
      orderedList: ctx.editor.isActive("orderedList"),
      taskList: ctx.editor.isActive("taskList"),
      blockquote: ctx.editor.isActive("blockquote"),
      codeBlock: ctx.editor.isActive("codeBlock"),
      link: ctx.editor.isActive("link"),
      canUndo: ctx.editor.can().undo(),
      canRedo: ctx.editor.can().redo(),
    }),
  });

  return (
    <div className="sticky top-0 z-10 -mx-1 mb-2 flex flex-wrap items-center gap-0.5 overflow-x-auto border-b border-zinc-800/80 bg-zinc-950/95 px-1 py-1.5 backdrop-blur">
      <ToolbarButton title="Heading 1" active={state.h1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <span className="text-xs font-bold">H1</span>
      </ToolbarButton>
      <ToolbarButton title="Heading 2" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <span className="text-xs font-bold">H2</span>
      </ToolbarButton>
      <ToolbarButton title="Heading 3" active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <span className="text-xs font-bold">H3</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Bold (Ctrl+B)" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <span className="text-sm font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton title="Italic (Ctrl+I)" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <span className="text-sm italic">I</span>
      </ToolbarButton>
      <ToolbarButton title="Strikethrough (Ctrl+Shift+S)" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <span className="text-sm line-through">S</span>
      </ToolbarButton>
      <ToolbarButton title="Inline code (Ctrl+E)" active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}>
        <span className="font-mono text-xs">{"</>"}</span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="Bullet list (Ctrl+Shift+8)" active={state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <ListIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Numbered list (Ctrl+Shift+7)" active={state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListNumberedIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Task checklist" active={state.taskList} onClick={() => editor.chain().focus().toggleTaskList().run()}>
        <TaskListIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Blockquote (Ctrl+Shift+B)" active={state.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <QuoteIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Code block (Ctrl+Alt+C)" active={state.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <CodeBracketIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <MinusIcon className="h-4 w-4" />
      </ToolbarButton>

      <div className="relative">
        <ToolbarButton title="Link" active={state.link} onClick={() => setLinkOpen((value) => !value)}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        {linkOpen ? <LinkPopover editor={editor} onClose={() => setLinkOpen(false)} /> : null}
      </div>

      <Divider />

      <ToolbarButton title="Undo (Ctrl+Z)" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
        <UndoIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title="Redo (Ctrl+Shift+Z)" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
        <RedoIcon className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}
