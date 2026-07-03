"use client";

import { useState } from "react";
import type { McqMode, QuestionType } from "@/lib/types";
import * as api from "@/lib/services/questionsApi";
import RichComposer from "@/components/ui/RichComposer";

const ROLE_OPTIONS = [
  "frontend",
  "backend",
  "fullstack",
  "mobile",
  "devops",
  "data",
  "ai-ml",
  "security",
  "qa",
  "product",
  "design",
  "career",
];

function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function AskQuestionForm({
  onCreated,
}: {
  onCreated: (questionId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<QuestionType>("open");
  const [mcqMode, setMcqMode] = useState<McqMode>("single");
  const [options, setOptions] = useState(["", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [roleTags, setRoleTags] = useState<string[]>([]);
  const [stackTagsInput, setStackTagsInput] = useState("");
  const [topicTagsInput, setTopicTagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleRole(role: string) {
    setRoleTags((prev) => {
      if (prev.includes(role)) return prev.filter((value) => value !== role);
      if (prev.length >= 2) return prev;
      return [...prev, role];
    });
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setCorrectOptionIndex((prev) => {
      if (prev === index) return 0;
      if (prev > index) return prev - 1;
      return prev;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const stackTags = splitTags(stackTagsInput).slice(0, 3);
      const topicTags = splitTags(topicTagsInput).slice(0, 3);
      const tags = [
        ...roleTags.map((tag) => ({ tag_type: "role" as const, tag })),
        ...stackTags.map((tag) => ({ tag_type: "stack" as const, tag })),
        ...topicTags.map((tag) => ({ tag_type: "topic" as const, tag })),
      ];

      const payload: api.QuestionUpsertPayload = {
        title,
        body,
        type,
        tags,
      };

      if (type === "mcq") {
        payload.mcq_mode = mcqMode;
        payload.options = options;
        payload.correct_option_index = correctOptionIndex;
      }

      const result = await api.createQuestion(payload);
      onCreated(result.question.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create question.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-4 py-5">
      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What is the cleanest way to share auth state across Next.js layouts?"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Details
        </label>
        <RichComposer
          value={body}
          onChange={(value) => setBody(value)}
          rows={7}
          placeholder="Add context, what you tried, constraints, and what kind of answer would help."
          previewClassName="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm leading-relaxed text-white"
           className="w-full px-4 py-3 text-sm leading-relaxed text-transparent caret-white outline-none selection:bg-[#1d9bf0]/30"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Question Type
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
          >
            <option value="open">Open question</option>
            <option value="mcq">MCQ question</option>
          </select>
        </label>

        {type === "mcq" && (
          <label className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              MCQ Mode
            </span>
            <select
              value={mcqMode}
              onChange={(e) => setMcqMode(e.target.value as McqMode)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
            >
              <option value="single">Single choice</option>
              <option value="multi">Multi-select</option>
            </select>
          </label>
        )}
      </div>

      {type === "mcq" && (
        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Options</h3>
            {options.length < 4 && (
              <button
                type="button"
                onClick={() => setOptions((prev) => [...prev, ""])}
                className="text-xs font-semibold text-sky-300 transition-colors hover:text-sky-200"
              >
                Add option
              </button>
            )}
          </div>

          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <label className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-300">
                  <input
                    type="radio"
                    name="correct-option"
                    checked={correctOptionIndex === index}
                    onChange={() => setCorrectOptionIndex(index)}
                    className="h-4 w-4 border-zinc-700 bg-zinc-900 text-white"
                  />
                  Correct
                </label>
                <input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            Mark exactly one option as the correct answer. Responders will see it after they submit.
          </p>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Role Tags</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Choose up to 2 role tags.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((role) => {
            const selected = roleTags.includes(role);
            return (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selected
                    ? "bg-white text-zinc-950"
                    : "border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Stack Tags
          </span>
          <input
            value={stackTagsInput}
            onChange={(e) => setStackTagsInput(e.target.value)}
            placeholder="react,nodejs,postgresql"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Topic Tags
          </span>
          <input
            value={topicTagsInput}
            onChange={(e) => setTopicTagsInput(e.target.value)}
            placeholder="testing,system-design,interview"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </label>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Publishing…" : "Publish question"}
        </button>
      </div>
    </form>
  );
}
