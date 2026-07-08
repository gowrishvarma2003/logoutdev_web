"use client";

import Modal from "@/components/ui/Modal";
import { useNotesWorkspace } from "./NotesWorkspaceContext";
import { FolderIcon, CheckIcon } from "@/components/ui/Icons";

interface MoveNoteDialogProps {
  open: boolean;
  onClose: () => void;
  currentFolderId: string | null;
  onSelect: (folderId: string | null) => Promise<void>;
}

export default function MoveNoteDialog({ open, onClose, currentFolderId, onSelect }: MoveNoteDialogProps) {
  const { folders } = useNotesWorkspace();

  async function handleSelect(folderId: string | null) {
    await onSelect(folderId);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Move to folder">
      <div className="max-h-72 space-y-0.5 overflow-y-auto">
        <button
          onClick={() => handleSelect(null)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
        >
          <FolderIcon className="h-4 w-4 text-text-disabled" />
          <span className="flex-1">No folder</span>
          {!currentFolderId ? <CheckIcon className="h-4 w-4 text-emerald-400" /> : null}
        </button>
        {folders.folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => handleSelect(folder.id)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <FolderIcon className="h-4 w-4 text-text-disabled" />
            <span className="flex-1 truncate">{folder.name}</span>
            {currentFolderId === folder.id ? <CheckIcon className="h-4 w-4 text-emerald-400" /> : null}
          </button>
        ))}
        {folders.folders.length === 0 ? (
          <p className="px-3 py-2 text-sm text-text-disabled">No folders yet — create one from the sidebar.</p>
        ) : null}
      </div>
    </Modal>
  );
}
