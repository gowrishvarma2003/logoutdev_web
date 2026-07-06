"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useNotesWorkspace } from "./NotesWorkspaceContext";
import CreateFolderDialog from "./CreateFolderDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/lib/hooks/useToast";
import { FolderIcon, PlusIcon, DotsIcon, EditIcon, TrashIcon } from "@/components/ui/Icons";
import { notesViewHref } from "@/lib/notesView";

export default function FolderList() {
  const { folders } = useNotesWorkspace();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const activeFolderId = searchParams.get("folder");

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    function handleClick(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest("[data-folder-menu-root]")) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenuId]);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between px-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Folders</span>
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label="New folder"
          title="New folder"
        >
          <PlusIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {folders.folders.length === 0 && !folders.loading ? (
        <p className="px-2 py-1 text-xs text-zinc-600">No folders yet.</p>
      ) : (
        <ul className="space-y-0.5">
          {folders.folders.map((folder) => {
            const active = activeFolderId === folder.id;
            return (
              <li key={folder.id} className="group relative" data-folder-menu-root>
                <Link
                  href={notesViewHref({ folder: folder.id })}
                  className={`flex items-center gap-2.5 rounded-lg py-1.5 pl-2 pr-7 text-sm transition-colors ${
                    active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                  }`}
                >
                  <FolderIcon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{folder.name}</span>
                  {folder.note_count ? <span className="text-xs text-zinc-600">{folder.note_count}</span> : null}
                </Link>
                <button
                  onClick={() => setOpenMenuId(openMenuId === folder.id ? null : folder.id)}
                  className={`absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:bg-zinc-700 hover:text-white ${
                    openMenuId === folder.id ? "flex" : "hidden group-hover:flex"
                  }`}
                  aria-label={`More actions for ${folder.name}`}
                >
                  <DotsIcon className="h-3.5 w-3.5" />
                </button>
                {openMenuId === folder.id ? (
                  <div className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-2xl">
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        setRenameTarget({ id: folder.id, name: folder.name });
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      <EditIcon className="h-3.5 w-3.5" /> Rename
                    </button>
                    <button
                      onClick={() => {
                        setOpenMenuId(null);
                        setDeleteTarget({ id: folder.id, name: folder.name });
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

      <CreateFolderDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (name) => {
          const folder = await folders.createFolder(name);
          showToast("Folder created", { tone: "success" });
          router.push(notesViewHref({ folder: folder.id }));
        }}
      />

      <CreateFolderDialog
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        mode="rename"
        initialName={renameTarget?.name || ""}
        onSubmit={async (name) => {
          if (!renameTarget) return;
          await folders.renameFolder(renameTarget.id, name);
          showToast("Folder renamed", { tone: "success" });
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete folder?"
        description={`Notes inside "${deleteTarget?.name}" move to "No folder" — they won't be deleted.`}
        confirmLabel="Delete folder"
        tone="danger"
        onConfirm={async () => {
          if (!deleteTarget) return;
          await folders.removeFolder(deleteTarget.id);
          showToast("Folder deleted", { tone: "success" });
          if (activeFolderId === deleteTarget.id) {
            router.push("/notes");
          }
        }}
      />
    </div>
  );
}
