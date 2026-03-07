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
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="space-y-2">
        {(question.options || []).map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 transition-colors ${
                checked ? "border-white bg-zinc-800" : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
              }`}
            >
              <input
                type={question.mcq_mode === "single" ? "radio" : "checkbox"}
                name={`question-${question.id}`}
                checked={checked}
                onChange={() => toggleOption(option.id)}
                className="h-4 w-4 border-zinc-700 bg-zinc-900 text-white"
              />
              <span className="text-sm text-white">{option.text}</span>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          {question.mcq_mode === "single" ? "Pick one option" : "Pick one or more options"}
        </span>
        <button
          type="submit"
          disabled={submitting || selected.length === 0}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting
            ? "Submitting…"
            : question.viewer_state?.has_answered
            ? "Update response"
            : "Submit response"}
        </button>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </form>
  );
}
