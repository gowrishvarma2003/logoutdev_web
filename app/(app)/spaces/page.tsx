"use client";

import { useState } from "react";
import Link from "next/link";
import { useSpaceList } from "@/lib/hooks/useSpaces";
import SpaceOverviewCard from "@/components/spaces/SpaceOverviewCard";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { PlusIcon, RocketIcon, SearchIcon } from "@/components/ui/Icons";
import type { SpaceStatus } from "@/lib/types";

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "",         label: "All" },
  { value: "idea",     label: "Idea" },
  { value: "building", label: "Building" },
  { value: "shipping", label: "Shipping" },
  { value: "paused",   label: "Paused" },
];

/**
 * /spaces — Discover project spaces.
 * Features search/filter + grid of space cards + prominent create CTA.
 */
export default function SpacesDiscoverPage() {
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, error } = useSpaceList({
    status: status || undefined,
    tag: tag || undefined,
    page,
  });

  const spaces = data?.spaces ?? [];
  const total = data?.total ?? 0;
  const hasMore = spaces.length >= 20;

  return (
    <div className="min-h-screen">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <RocketIcon className="w-5 h-5 text-white" />
            <h1 className="text-lg font-bold text-white">Spaces</h1>
            {total > 0 && (
              <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </div>
          <Link
            href="/spaces/create"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New Space
          </Link>
        </div>

        {/* ── Search bar ──────────────────────────────────────────────────── */}
        <div className="px-4 pb-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by tech stack (e.g. react, python)…"
              value={tag}
              onChange={(e) => { setTag(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 transition-colors"
            />
          </div>
        </div>

        {/* ── Status filter pills ─────────────────────────────────────────── */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                status === f.value
                  ? "bg-white text-zinc-950"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="p-4">
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {!loading && !error && spaces.length === 0 && (
          <EmptyState
            icon={<RocketIcon className="w-12 h-12" />}
            title="No spaces found"
            description={
              tag || status
                ? "Try adjusting your filters."
                : "Be the first to create a project space!"
            }
            action={
              <Link
                href="/spaces/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Create Space
              </Link>
            }
          />
        )}

        {!loading && !error && spaces.length > 0 && (
          <>
            <div className="grid gap-3">
              {spaces.map((space) => (
                <SpaceOverviewCard key={space.id} space={space} />
              ))}
            </div>

            {/* Pagination */}
            {(page > 1 || hasMore) && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-400 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-zinc-500">Page {page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasMore}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-400 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
