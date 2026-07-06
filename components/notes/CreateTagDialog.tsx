"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";

interface CreateTagDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: string | null) => Promise<void>;
  initialName?: string;
  initialColor?: string | null;
  mode?: "create" | "rename";
}

const NAME_MAX_LENGTH = 50;
const PRESET_COLORS = ["#f87171", "#fb923c", "#facc15", "#4ade80", "#22d3ee", "#60a5fa", "#a78bfa", "#f472b6"];

export default function CreateTagDialog({
  open,
  onClose,
  onSubmit,
  initialName = "",
  initialColor = null,
  mode = "create",
}: CreateTagDialogProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<string | null>(initialColor);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setColor(initialColor);
      setError(null);
    }
  }, [open, initialName, initialColor]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Tag name can't be empty.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onSubmit(trimmed, color);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save tag.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === "create" ? "New tag" : "Edit tag"}>
      <form onSubmit={handleSubmit}>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={NAME_MAX_LENGTH}
          placeholder="Tag name"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
        />

        <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Color</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setColor(null)}
            className={`h-7 w-7 rounded-full border-2 border-dashed border-zinc-600 text-[10px] text-zinc-500 ${
              !color ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950" : ""
            }`}
            title="No color"
          >
            ×
          </button>
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setColor(preset)}
              className={`h-7 w-7 rounded-full transition-transform hover:scale-105 ${
                color === preset ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-950" : ""
              }`}
              style={{ backgroundColor: preset }}
              title={preset}
            />
          ))}
        </div>

        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
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
            {mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
