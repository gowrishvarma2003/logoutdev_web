"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";

interface RenameNoteDialogProps {
  open: boolean;
  onClose: () => void;
  initialTitle: string;
  onSubmit: (title: string) => Promise<void>;
}

export default function RenameNoteDialog({ open, onClose, initialTitle, onSubmit }: RenameNoteDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setError(null);
    }
  }, [open, initialTitle]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit(title.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename note.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Rename note">
      <form onSubmit={handleSubmit}>
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={200}
          placeholder="Untitled"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
        />
        {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-60"
          >
            {busy ? <Spinner size="sm" /> : null}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
