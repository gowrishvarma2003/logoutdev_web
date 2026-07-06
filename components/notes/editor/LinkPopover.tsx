"use client";

import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

interface LinkPopoverProps {
  editor: Editor;
  onClose: () => void;
}

export default function LinkPopover({ editor, onClose }: LinkPopoverProps) {
  const [url, setUrl] = useState<string>(editor.getAttributes("link").href || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onClose]);

  function apply() {
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      onClose();
      return;
    }
    const href = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    onClose();
  }

  function removeLink() {
    editor.chain().focus().unsetLink().run();
    onClose();
  }

  return (
    <div
      ref={popoverRef}
      className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-zinc-800 bg-zinc-900 p-3 shadow-2xl"
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          apply();
        } else if (event.key === "Escape") {
          onClose();
        }
      }}
    >
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        Link URL
      </label>
      <input
        ref={inputRef}
        type="text"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://example.com"
        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-sm text-white outline-none focus:border-zinc-600"
      />
      <div className="mt-2.5 flex justify-end gap-2">
        {editor.isActive("link") ? (
          <button
            type="button"
            onClick={removeLink}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10"
          >
            Remove
          </button>
        ) : null}
        <button
          type="button"
          onClick={apply}
          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
