"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useNotesWorkspace } from "./NotesWorkspaceContext";
import CreateTagDialog from "./CreateTagDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/lib/hooks/useToast";
import { PlusIcon, DotsIcon, EditIcon, TrashIcon } from "@/components/ui/Icons";
import { notesViewHref } from "@/lib/notesView";

export default function TagList() {
  const { tags } = useNotesWorkspace();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const activeTagId = searchParams.get("tag");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string; color: string | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    function handleClick(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest("[data-tag-menu-root]")) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenuId]);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between px-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-disabled">Tags</span>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-lg p-1 text-text-disabled transition-colors hover:bg-surface-hover hover:text-text-primary"
          aria-label="New tag"
          title="New tag"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {tags.tags.length === 0 && !tags.loading ? (
        <p className="px-2 py-1 text-xs text-text-disabled">No tags yet.</p>
      ) : (
        <ul className="space-y-0.5">
          {tags.tags.map((tag) => {
            const active = activeTagId === tag.id;
            return (
              <li key={tag.id} className="group relative" data-tag-menu-root>
                <Link
                  href={notesViewHref({ tag: tag.id })}
                  className={`flex items-center gap-2.5 rounded-lg py-1.5 pl-2 pr-7 text-sm transition-colors ${
                    active ? "bg-surface-hover text-text-primary" : "text-text-muted hover:bg-surface-hover/60 hover:text-text-primary"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color || "#71717a" }}
                  />
                  <span className="flex-1 truncate">{tag.name}</span>
                  {tag.note_count ? <span className="text-xs text-text-disabled">{tag.note_count}</span> : null}
                </Link>
                <button
                  onClick={() => setOpenMenuId(openMenuId === tag.id ? null : tag.id)}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-disabled hover:bg-surface-active hover:text-text-primary ${
                    openMenuId === tag.id ? "flex" : "hidden group-hover:flex"
                  }`}
                  aria-label={`More actions for ${tag.name}`}
                >
                  <DotsIcon className="h-3.5 w-3.5" />
                </button>
                {openMenuId === tag.id ? (
                  <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-border-default bg-surface py-1 shadow-2xl">
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        setEditTarget({ id: tag.id, name: tag.name, color: tag.color });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    >
                      <EditIcon className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        setDeleteTarget({ id: tag.id, name: tag.name });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-400 hover:bg-rose-500/10"
                    >
                      <TrashIcon className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <CreateTagDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (name, color) => {
          const tag = await tags.createTag(name, color);
          showToast("Tag created", { tone: "success" });
          router.push(notesViewHref({ tag: tag.id }));
        }}
      />

      <CreateTagDialog
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        mode="rename"
        initialName={editTarget?.name || ""}
        initialColor={editTarget?.color || null}
        onSubmit={async (name, color) => {
          if (!editTarget) return;
          await tags.renameTag(editTarget.id, { name, color });
          showToast("Tag updated", { tone: "success" });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete tag?"
        description={`"${deleteTarget?.name}" will be removed from every note that has it.`}
        confirmLabel="Delete tag"
        tone="danger"
        onConfirm={async () => {
          if (!deleteTarget) return;
          await tags.removeTag(deleteTarget.id);
          showToast("Tag deleted", { tone: "success" });
          if (activeTagId === deleteTarget.id) {
            router.push("/notes");
          }
        }}
      />
    </div>
  );
}
