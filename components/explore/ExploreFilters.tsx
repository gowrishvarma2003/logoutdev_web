"use client";

import { SearchIcon } from "@/components/ui/Icons";

const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "builders", label: "Builders" },
  { value: "launches", label: "Launches" },
  { value: "spaces", label: "Spaces" },
  { value: "questions", label: "Questions" },
  { value: "freelance", label: "Freelance" },
];

interface ExploreFiltersProps {
  q: string;
  type: string;
  stack: string;
  collab: boolean;
  sort: string;
  onChange: (patch: Partial<{ q: string; type: string; stack: string; collab: boolean; sort: string }>) => void;
}

export default function ExploreFilters({ q, type, stack, collab, sort, onChange }: ExploreFiltersProps) {
  return (
    <div className="border-b border-zinc-800 bg-zinc-950/75 px-4 py-4 backdrop-blur-md">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={q}
          onChange={(event) => onChange({ q: event.target.value })}
          placeholder="Search builders, launches, spaces, questions, and freelance work"
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.value || "all"}
            type="button"
            onClick={() => onChange({ type: option.value })}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              type === option.value
                ? "bg-white text-zinc-950"
                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={stack}
          onChange={(event) => onChange({ stack: event.target.value })}
          placeholder="Filter by stack, like React or Python"
          className="min-w-0 flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
        />

        <select
          value={sort}
          onChange={(event) => onChange({ sort: event.target.value })}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"
        >
          <option value="recommended">Recommended</option>
          <option value="newest">Newest</option>
          <option value="active">Active</option>
        </select>

        <button
          type="button"
          onClick={() => onChange({ collab: !collab })}
          className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
            collab
              ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
              : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700"
          }`}
        >
          {collab ? "Collab open" : "Any collaboration state"}
        </button>
      </div>
    </div>
  );
}