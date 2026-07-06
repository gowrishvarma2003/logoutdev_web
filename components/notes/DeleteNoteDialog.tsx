"use client";

import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface DeleteNoteDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "trash" | "permanent";
  noteTitle: string;
  onConfirm: () => Promise<void>;
}

/** Confirms moving a note to Trash, or permanently deleting it from Trash. */
export default function DeleteNoteDialog({ open, onClose, mode, noteTitle, onConfirm }: DeleteNoteDialogProps) {
  const title = mode === "trash" ? "Move note to Trash?" : "Delete note permanently?";
  const description =
    mode === "trash"
      ? `"${noteTitle || "Untitled"}" will move to Trash. You can restore it anytime before it's permanently deleted.`
      : `"${noteTitle || "Untitled"}" will be permanently deleted. This can't be undone.`;

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      confirmLabel={mode === "trash" ? "Move to Trash" : "Delete permanently"}
      tone="danger"
      onConfirm={onConfirm}
    />
  );
}
