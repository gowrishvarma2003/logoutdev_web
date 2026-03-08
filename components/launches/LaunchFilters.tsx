"use client";

import { SearchIcon } from "@/components/ui/Icons";

interface LaunchFiltersProps {
  q: string;
  onQChange: (value: string) => void;
  productType: string;
  onProductTypeChange: (value: string) => void;
  developmentStage: string;
  onDevelopmentStageChange: (value: string) => void;
  stack: string;
  onStackChange: (value: string) => void;
  seekingCollaborators: boolean;
  onSeekingCollaboratorsChange: (value: boolean) => void;
  sort: string;
  onSortChange: (value: string) => void;
}

const selectClass =
  "rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 focus:border-zinc-600 focus:outline-none hover:bg-zinc-800 transition-colors";

export default function LaunchFilters({
  q,
  onQChange,
  productType,
  onProductTypeChange,
  developmentStage,
  onDevelopmentStageChange,
  stack,
  onStackChange,
  seekingCollaborators,
  onSeekingCollaboratorsChange,
  sort,
  onSortChange,
}: LaunchFiltersProps) {
  return (
    <div className="space-y-3 border-b border-zinc-800 px-4 py-3">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Search by name, tagline, or problem…"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
      </div>

      {/* Filter pills row */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={productType} onChange={(e) => onProductTypeChange(e.target.value)} className={selectClass}>
          <option value="">All types</option>
          <option value="web-app">Web App</option>
          <option value="mobile-app">Mobile App</option>
          <option value="developer-tool">Dev Tool</option>
          <option value="api">API</option>
          <option value="ai-tool">AI Tool</option>
          <option value="open-source">Open Source</option>
          <option value="experimental">Experimental</option>
          <option value="other">Other</option>
        </select>

        <select
          value={developmentStage}
          onChange={(e) => onDevelopmentStageChange(e.target.value)}
          className={selectClass}
        >
          <option value="">All stages</option>
          <option value="prototype">Prototype</option>
          <option value="mvp">MVP</option>
          <option value="beta">Beta</option>
          <option value="live">Live</option>
          <option value="maintained">Maintained</option>
          <option value="paused">Paused</option>
        </select>

        <input
          type="text"
          value={stack}
          onChange={(e) => onStackChange(e.target.value)}
          placeholder="Stack…"
          className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />

        <select value={sort} onChange={(e) => onSortChange(e.target.value)} className={selectClass}>
          <option value="newest">Newest first</option>
          <option value="top">Top upvoted</option>
        </select>

        <button
          type="button"
          onClick={() => onSeekingCollaboratorsChange(!seekingCollaborators)}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            seekingCollaborators
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          {seekingCollaborators ? "✓ " : ""}Seeking collaborators
        </button>
      </div>
    </div>
  );
}