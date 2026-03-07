"use client";

import type { QuestionListFilters } from "@/lib/services/questionsApi";

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

function parseCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function QuestionFilters({
  filters,
  onChange,
  isAuthenticated,
}: {
  filters: QuestionListFilters;
  onChange: (patch: Partial<QuestionListFilters>) => void;
  isAuthenticated: boolean;
}) {
  return (
    <div className="space-y-3 border-b border-zinc-800 px-4 py-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Type
          </span>
          <select
            value={filters.type ?? ""}
            onChange={(e) => onChange({ type: (e.target.value as QuestionListFilters["type"]) || "" })}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="mcq">MCQ</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Status
          </span>
          <select
            value={filters.status ?? ""}
            onChange={(e) => onChange({ status: (e.target.value as QuestionListFilters["status"]) || "" })}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Sort
          </span>
          <select
            value={filters.sort ?? "active"}
            onChange={(e) => onChange({ sort: e.target.value as QuestionListFilters["sort"] })}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
          >
            <option value="active">Active</option>
            <option value="newest">Newest</option>
            <option value="unanswered">Unanswered</option>
            <option value="top">Top</option>
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Role
          </span>
          <select
            value={filters.role?.[0] ?? ""}
            onChange={(e) => onChange({ role: e.target.value ? [e.target.value] : [] })}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
          >
            <option value="">Any role</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Stack Tags
          </span>
          <input
            value={(filters.stack ?? []).join(",")}
            onChange={(e) => onChange({ stack: parseCsv(e.target.value) })}
            placeholder="react,nodejs,postgresql"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </label>

        <label className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
            Topic Tags
          </span>
          <input
            value={(filters.topic ?? []).join(",")}
            onChange={(e) => onChange({ topic: parseCsv(e.target.value) })}
            placeholder="testing,interview,system-design"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />
        </label>
      </div>

      {isAuthenticated && (
        <label className="inline-flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={Boolean(filters.needs_my_answer)}
            onChange={(e) => onChange({ needs_my_answer: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-white"
          />
          Show only questions I can still answer
        </label>
      )}
    </div>
  );
}
