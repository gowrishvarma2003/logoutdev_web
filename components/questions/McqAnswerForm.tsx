"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/types";

export default function McqAnswerForm({
  question,
  onSubmit,
}: {
  question: Question;
  onSubmit: (optionIds: string[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const preselected = (question.options || [])
      .filter((option) => option.selected_by_me)
      .map((option) => option.id);
    setSelected(preselected);
  }, [question.options]);

  function toggleOption(optionId: string) {
    if (question.mcq_mode === "single") {
      setSelected([optionId]);
      return;
    }

    setSelected((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0 || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      await onSubmit(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit response.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
      <div className="space-y-2.5">
        {(question.options || []).map((option, idx) => {
          const checked = selected.includes(option.id);
          const letter = String.fromCharCode(65 + idx); // A, B, C, D...
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggleOption(option.id)}
              className={`group flex w-full cursor-pointer items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all duration-300 ${
                checked
                  ? "border-sky-500 bg-sky-500/5 shadow-[0_0_12px_rgba(56,189,248,0.03)]"
                  : "border-zinc-900 bg-zinc-900/10 hover:border-zinc-800 hover:bg-zinc-900/20"
              }`}
            >
              {/* Custom Selector Bullet */}
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition-all duration-300 ${
                  checked
                    ? "border-sky-500 bg-sky-500 text-zinc-950"
                    : "border-zinc-800 bg-zinc-950 text-zinc-400 group-hover:border-zinc-700 group-hover:text-zinc-200"
                }`}
              >
                {letter}
              </div>
              <span className={`text-sm font-medium transition-colors ${checked ? "text-white" : "text-zinc-300 group-hover:text-zinc-200"}`}>
                {option.text}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-2">
        <span className="text-xs text-zinc-500">
          {question.mcq_mode === "single" ? "Choose one option" : "Choose one or more options"}
        </span>
        <button
          type="submit"
          disabled={submitting || selected.length === 0}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting
            ? "Submitting…"
            : question.viewer_state?.has_answered
            ? "Update Response"
            : "Submit Response"}
        </button>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </form>
  );
}

