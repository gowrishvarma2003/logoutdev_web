"use client";

import Link from "next/link";
import { FolderIcon, PinIcon, StarIcon } from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";
import NoteMoreMenu, { type NoteMoreMenuChange } from "./NoteMoreMenu";
import type { NoteListItem as NoteListItemType } from "@/lib/types";

interface NoteListItemProps {
  note: NoteListItemType;
  onChanged: (change: NoteMoreMenuChange) => void;
}

export default function NoteListItem({ note, onChanged }: NoteListItemProps) {
  return (
    <li className="group relative">
      <Link
        href={`/notes/${note.id}`}
        className="flex items-start gap-3 rounded-xl border border-transparent px-3 py-3 pr-11 transition-colors hover:border-zinc-800 hover:bg-zinc-900/60"
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80 text-base">
          {note.icon || "📝"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[13.5px] font-semibold text-white">{note.title || "Untitled"}</h3>
            {note.is_pinned ? <PinIcon className="h-3 w-3 shrink-0 text-amber-400" /> : null}
            {note.is_favorite ? <StarIcon className="h-3 w-3 shrink-0 text-amber-400" filled /> : null}
          </div>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-500">
            {note.excerpt || "No content yet"}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[11px] text-zinc-600">
            <span>{formatRelativeTime(note.updated_at)}</span>
            {note.folder ? (
              <span className="inline-flex items-center gap-1">
                <FolderIcon className="h-3 w-3" />
                {note.folder.name}
              </span>
            ) : null}
            {note.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color || "#71717a" }} />
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </Link>
      <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <NoteMoreMenu note={note} context="list" onChanged={onChanged} />
      </div>
    </li>
  );
}
