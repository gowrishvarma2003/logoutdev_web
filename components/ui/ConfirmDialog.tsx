"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";

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
        <Button
          type="button"
          disabled={busy}
          onClick={onClose}
          variant="secondary"
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          disabled={busy}
          onClick={handleConfirm}
          variant={tone === "danger" ? "danger" : "primary"}
        >
          {busy ? <Spinner size="sm" /> : null}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
