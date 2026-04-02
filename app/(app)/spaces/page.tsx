"use client";

import { useState } from "react";
import Link from "next/link";
import { useSpaceList } from "@/lib/hooks/useSpaces";
import SpaceOverviewCard from "@/components/spaces/SpaceOverviewCard";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { PlusIcon, RocketIcon, SearchIcon, ChevronDownIcon } from "@/components/ui/Icons";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "idea", label: "Idea" },
  { value: "building", label: "Building" },
  { value: "shipping", label: "Shipping" },
  { value: "paused", label: "Paused" },
];

const TOGGLE_FILTERS = [
  { key: "working_in_public", label: "Working in public" },
  { key: "looking_for_contributors", label: "Looking for contributors" },
  { key: "good_first_tasks", label: "Good first tasks" },
  { key: "recently_shipped", label: "Recently shipped" },
] as const;

export default function SpacesDiscoverPage() {
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");
  const [neededSkill, setNeededSkill] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toggles, setToggles] = useState<Record<(typeof TOGGLE_FILTERS)[number]["key"], boolean>>({
    working_in_public: false,
    looking_for_contributors: false,
    good_first_tasks: false,
    recently_shipped: false,
  });

  const { data, loading, error } = useSpaceList({
    status: status || undefined,
    tag: tag || undefined,
    needed_skill: neededSkill || undefined,
    working_in_public: toggles.working_in_public || undefined,
    looking_for_contributors: toggles.looking_for_contributors || undefined,
    good_first_tasks: toggles.good_first_tasks || undefined,
    recently_shipped: toggles.recently_shipped || undefined,
    page,
  });

  const spaces = data?.spaces ?? [];
  const total = data?.total ?? 0;
  const hasMore = spaces.length >= 20;

  const hasActiveFilters =
    neededSkill.trim().length > 0 ||
    status !== "" ||
    Object.values(toggles).some(Boolean);
  const activeCount =
    (neededSkill.trim().length > 0 ? 1 : 0) +
    (status !== "" ? 1 : 0) +
    Object.values(toggles).filter(Boolean).length;

  function clearFilters() {
    setNeededSkill("");
    setStatus("");
    setToggles({
      working_in_public: false,
      looking_for_contributors: false,
      good_first_tasks: false,
      recently_shipped: false,
    });
    setPage(1);
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <RocketIcon className="h-5 w-5 text-white" />
            <h1 className="text-lg font-bold text-white">Spaces</h1>
            {total > 0 ? (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">{total}</span>
            ) : null}
          </div>
          <Link
            href="/spaces/create"
            className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
          >
            <PlusIcon className="h-4 w-4" />
            New Space
          </Link>
        </div>

        {/* Search + Filters row */}
        <div className="flex flex-wrap items-center gap-3 px-4 pb-3">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search stack or project theme"
              value={tag}
              onChange={(e) => { setTag(e.target.value); setPage(1); }}
              aria-label="Search spaces"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Filters dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
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
                <div className="fixed inset-0 z-10" onClick={() => setFiltersOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
                  <div className="space-y-4">
                    {/* Needed skill */}
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Needed Skill
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rust, Design..."
                        value={neededSkill}
                        onChange={(e) => { setNeededSkill(e.target.value); setPage(1); }}
                        aria-label="Filter by needed skill"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
                      />
                    </div>

                    {/* Status filter */}
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Status
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUS_FILTERS.map((filter) => (
                          <button
                            key={filter.value || "all"}
                            onClick={() => { setStatus(filter.value); setPage(1); }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              status === filter.value
                                ? "bg-white text-zinc-950"
                                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                            }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Toggle filters */}
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                        Signals
                      </label>
                      <div className="flex flex-col gap-1.5">
                        {TOGGLE_FILTERS.map((filter) => (
                          <button
                            key={filter.key}
                            onClick={() => {
                              setToggles((c) => ({ ...c, [filter.key]: !c[filter.key] }));
                              setPage(1);
                            }}
                            className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                              toggles[filter.key]
                                ? "bg-sky-500/10 text-sky-400"
                                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                            }`}
                          >
                            {toggles[filter.key] ? "✓ " : ""}{filter.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear */}
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
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
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : null}

        {error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        ) : null}

        {!loading && !error && spaces.length === 0 ? (
          <EmptyState
            icon={<RocketIcon className="h-12 w-12" />}
            title="No spaces found"
            description={
              tag || status || neededSkill || Object.values(toggles).some(Boolean)
                ? "Try widening the filters or exploring a different skill signal."
                : "Be the first to create a public project space."
            }
            action={
              <Link
                href="/spaces/create"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
              >
                <PlusIcon className="h-4 w-4" />
                Create Space
              </Link>
            }
          />
        ) : null}

        {!loading && !error && spaces.length > 0 ? (
          <>
            <div className="grid gap-3">
              {spaces.map((space) => (
                <SpaceOverviewCard key={space.id} space={space} />
              ))}
            </div>

            {page > 1 || hasMore ? (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-xs text-zinc-500">Page {page}</span>
                <button
                  onClick={() => setPage((current) => current + 1)}
                  disabled={!hasMore}
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
