"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title} description={description}>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleConfirm}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
            tone === "danger" ? "bg-rose-600 text-white hover:bg-rose-500" : "bg-white text-zinc-950 hover:bg-zinc-200"
          }`}
        >
          {busy ? <Spinner size="sm" /> : null}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
