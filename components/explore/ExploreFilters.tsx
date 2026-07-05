"use client";

import { useState } from "react";
import {
  SearchIcon,
  ChevronDownIcon,
  CompassIcon,
  UsersIcon,
  RocketIcon,
  FolderIcon,
  ChatBubbleIcon,
  BriefcaseIcon,
  XIcon,
} from "@/components/ui/Icons";

const TYPE_OPTIONS = [
  { value: "", label: "All", icon: CompassIcon },
  { value: "builders", label: "Builders", icon: UsersIcon },
  { value: "launches", label: "Launches", icon: RocketIcon },
  { value: "spaces", label: "Spaces", icon: FolderIcon },
  { value: "questions", label: "Questions", icon: ChatBubbleIcon },
  { value: "freelance", label: "Freelance", icon: BriefcaseIcon },
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
    <div className="border-b border-zinc-800/60 bg-zinc-950/20 backdrop-blur-md px-4 py-4 space-y-4">
      {/* Row 1: Search + Filters Dropdown Toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input Container */}
        <div className="relative min-w-0 flex-1">
          <SearchIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder="Search builders, launches, spaces..."
            aria-label="Search"
            className="w-full rounded-xl border border-zinc-850 bg-zinc-900/20 py-3 pl-11 pr-4 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-700 focus:bg-zinc-900/40 focus:outline-none transition-all duration-300"
          />
        </div>

        {/* Filters Panel Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
              hasActiveFilters
                ? "border-sky-500/30 bg-sky-500/10 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.05)]"
                : "border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            }`}
          >
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-[10px] font-bold text-white animate-pulse">
                {activeCount}
              </span>
            )}
            <ChevronDownIcon className={`h-4 w-4 transition-transform duration-300 ${filtersOpen ? "rotate-180" : ""}`} />
          </button>

          {filtersOpen && (
            <>
              <div className="fixed inset-0 z-10 cursor-pointer" onClick={() => setFiltersOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-850 bg-zinc-900/90 p-4 shadow-2xl backdrop-blur-lg">
                <div className="space-y-4">
                  {/* Tech Stack filter */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Tech Stack
                    </label>
                    <input
                      type="text"
                      value={stack}
                      onChange={(e) => onChange({ stack: e.target.value })}
                      placeholder="e.g. React, Python..."
                      aria-label="Filter by tech stack"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-white placeholder:text-zinc-650 focus:border-zinc-700 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Sort by
                    </label>
                    <div className="flex flex-col gap-1">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => onChange({ sort: option.value })}
                          className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                            sort === option.value
                              ? "bg-zinc-800 text-white"
                              : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
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
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                      collab
                        ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                        : "border-zinc-800 bg-zinc-800/50 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    {collab ? "✓ Collaboration Open" : "Any Collaboration State"}
                  </button>

                  {/* Clear */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ stack: "", sort: "recommended", collab: false });
                      }}
                      className="w-full rounded-lg border border-zinc-800 py-2 text-sm font-semibold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Removable Active Filter Pills (If any active) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 animate-chat-fade-in">
          <span className="text-[10px] font-semibold text-zinc-500 mr-1 uppercase">Active:</span>
          {stack.trim().length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/40 pl-2.5 pr-1.5 py-0.5 text-xs text-zinc-300">
              Stack: <span className="text-zinc-100 font-medium">{stack}</span>
              <button
                type="button"
                onClick={() => onChange({ stack: "" })}
                className="rounded-full p-0.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
                aria-label="Remove stack filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {collab && (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/10 bg-sky-500/5 pl-2.5 pr-1.5 py-0.5 text-xs text-sky-300">
              Collab Open
              <button
                type="button"
                onClick={() => onChange({ collab: false })}
                className="rounded-full p-0.5 hover:bg-sky-500/15 text-sky-400 hover:text-sky-200 transition-colors"
                aria-label="Remove collaboration filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          {sort !== "recommended" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/40 pl-2.5 pr-1.5 py-0.5 text-xs text-zinc-300">
              Sort: <span className="text-zinc-100 font-medium capitalize">{sort}</span>
              <button
                type="button"
                onClick={() => onChange({ sort: "recommended" })}
                className="rounded-full p-0.5 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200 transition-colors"
                aria-label="Remove sort filter"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={() => onChange({ stack: "", sort: "recommended", collab: false })}
            className="text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 underline pl-1.5 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Row 3: Sliding Glassmorphic Category Navigation Tabs */}
      <div className="relative pt-2">
        <div className="flex border-b border-zinc-800/40 overflow-x-auto no-scrollbar scroll-smooth gap-1">
          {TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = type === option.value;
            return (
              <button
                key={option.value || "all"}
                type="button"
                onClick={() => onChange({ type: option.value })}
                className={`relative flex items-center gap-2 px-4 pb-3.5 pt-1 text-xs font-semibold tracking-wide transition-all duration-300 ${
                  isActive
                    ? "text-sky-300 font-bold"
                    : "text-zinc-500 hover:text-zinc-350"
                }`}
              >
                <Icon className={`h-4 w-4 transition-colors duration-300 ${isActive ? "text-sky-300" : "text-zinc-500 group-hover:text-zinc-400"}`} />
                {option.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-400 to-indigo-500 shadow-[0_1px_8px_rgba(56,189,248,0.4)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
