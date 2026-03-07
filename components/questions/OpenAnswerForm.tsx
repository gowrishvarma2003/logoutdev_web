"use client";

import { useEffect, useState } from "react";

const MAX_LENGTH = 3000;

export default function OpenAnswerForm({
  initialValue = "",
  submitLabel,
  onSubmit,
  placeholder = "Write your answer…",
}: {
  initialValue?: string;
  submitLabel: string;
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
}) {
  const [body, setBody] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setBody(initialValue);
  }, [initialValue]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 20 || body.trim().length > MAX_LENGTH || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      await onSubmit(body.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer.");
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = MAX_LENGTH - body.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
      />

      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            remaining < 0 ? "text-rose-400" : remaining < 120 ? "text-amber-400" : "text-zinc-500"
          }`}
        >
          {remaining}
        </span>
        <button
          type="submit"
          disabled={submitting || body.trim().length < 20 || remaining < 0}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </form>
  );
}
