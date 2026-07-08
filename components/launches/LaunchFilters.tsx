"use client";

import { useState } from "react";
import { SearchIcon, ChevronDownIcon } from "@/components/ui/Icons";

interface LaunchFiltersProps {
  q: string;
  onQChange: (value: string) => void;
  launchPhase: string;
  onLaunchPhaseChange: (value: string) => void;
  stack: string;
  onStackChange: (value: string) => void;
  sort: string;
  onSortChange: (value: string) => void;
}

const PHASES = [
  { value: "", label: "All", color: "zinc" },
  { value: "beta", label: "Beta", color: "sky" },
  { value: "live", label: "Live", color: "emerald" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "top", label: "Most upvoted" },
];

export default function LaunchFilters({
  q,
  onQChange,
  launchPhase,
  onLaunchPhaseChange,
  stack,
  onStackChange,
  sort,
  onSortChange,
}: LaunchFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const currentSort = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0];
  const hasActiveFilters = stack.trim().length > 0 || sort !== "newest";

  return (
    <div className="border-b border-border-default/60 px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search - more prominent */}
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
          <input
            type="text"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Search launches..."
            className="w-full rounded-xl border border-border-default bg-surface/40 py-3 pl-11 pr-4 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:bg-surface/60 focus:outline-none transition-colors"
          />
        </div>

        {/* Phase toggle - cleaner pills */}
        <div className="flex rounded-xl border border-border-default bg-surface/40 p-1">
          {PHASES.map((phase) => {
            const isActive = launchPhase === phase.value;
            return (
              <button
                key={phase.value}
                type="button"
                onClick={() => onLaunchPhaseChange(phase.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? phase.color === "sky"
                      ? "bg-sky-500 text-text-primary shadow-sm"
                      : phase.color === "emerald"
                      ? "bg-emerald-500 text-text-primary shadow-sm"
                      : "bg-surface-active text-text-primary shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {phase.label}
              </button>
            );
          })}
        </div>

        {/* Filters dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-colors ${
              hasActiveFilters
                ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                : "border-border-default bg-surface/40 text-text-muted hover:text-text-secondary"
            }`}
          >
            Filters
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-text-primary">
                {(stack.trim().length > 0 ? 1 : 0) + (sort !== "newest" ? 1 : 0)}
              </span>
            )}
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>

          {filtersOpen && (
            <>
              <div className="fixed inset-0 z-10 cursor-pointer" onClick={() => setFiltersOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-xl border border-border-strong bg-surface p-4 shadow-xl">
                <div className="space-y-4">
                  {/* Tech stack filter */}
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-disabled">
                      Tech Stack
                    </label>
                    <input
                      type="text"
                      value={stack}
                      onChange={(e) => onStackChange(e.target.value)}
                      placeholder="e.g. React, Node..."
                      className="w-full rounded-lg border border-border-strong bg-surface-hover px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none"
                    />
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-disabled">
                      Sort by
                    </label>
                    <div className="flex flex-col gap-1">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => onSortChange(option.value)}
                          className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                            sort === option.value
                              ? "bg-surface-hover text-text-primary"
                              : "text-text-muted hover:bg-surface-hover/50 hover:text-text-secondary"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear filters */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        onStackChange("");
                        onSortChange("newest");
                      }}
                      className="w-full rounded-lg border border-border-strong py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text-secondary"
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
    </div>
  );
}
