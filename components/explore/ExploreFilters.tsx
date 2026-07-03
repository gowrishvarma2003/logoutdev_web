"use client";

import { useState } from "react";
import { SearchIcon, ChevronDownIcon } from "@/components/ui/Icons";

const TYPE_OPTIONS = [
  { value: "", label: "All" },
  { value: "builders", label: "Builders" },
  { value: "launches", label: "Launches" },
  { value: "spaces", label: "Spaces" },
  { value: "questions", label: "Questions" },
  { value: "freelance", label: "Freelance" },
];

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "newest", label: "Newest" },
  { value: "active", label: "Active" },
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasActiveFilters = stack.trim().length > 0 || sort !== "recommended" || collab;
  const activeCount = (stack.trim().length > 0 ? 1 : 0) + (sort !== "recommended" ? 1 : 0) + (collab ? 1 : 0);

  return (
    <div className="border-b border-zinc-800/60 px-4 py-4">
      {/* Row 1: Search + type pills + Filters button */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Search builders, launches, spaces..."
            aria-label="Search"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:bg-zinc-900/60 focus:outline-none transition-colors"
          />
        </div>

        {/* Filters dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
              hasActiveFilters
                ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>

          {filtersOpen && (
            <>
              <div className="fixed inset-0 z-10 cursor-pointer" onClick={() => setFiltersOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
                <div className="space-y-4">
                  {/* Stack filter */}
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Tech Stack
                    </label>
                    <input
                      type="text"
                      value={stack}
                      onChange={(e) => onChange({ stack: e.target.value })}
                      placeholder="e.g. React, Python..."
                      aria-label="Filter by tech stack"
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
                    />
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Sort by
                    </label>
                    <div className="flex flex-col gap-1">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => onChange({ sort: option.value })}
                          className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            sort === option.value
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Collab toggle */}
                  <button
                    type="button"
                    onClick={() => onChange({ collab: !collab })}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                      collab
                        ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                        : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    {collab ? "✓ Collab open" : "Any collaboration state"}
                  </button>

                  {/* Clear */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ stack: "", sort: "recommended", collab: false });
                      }}
                      className="w-full rounded-lg border border-zinc-700 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Type pills — always visible */}
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
    </div>
  );
}
