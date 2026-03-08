"use client";

import { useState } from "react";
import Link from "next/link";
import LaunchCard from "@/components/launches/LaunchCard";
import LaunchFilters from "@/components/launches/LaunchFilters";
import Spinner from "@/components/ui/Spinner";
import { PlusIcon, SparklesIcon } from "@/components/ui/Icons";
import { useLaunches } from "@/lib/hooks/useLaunches";

export default function LaunchesPage() {
  const [q, setQ] = useState("");
  const [productType, setProductType] = useState("");
  const [developmentStage, setDevelopmentStage] = useState("");
  const [stack, setStack] = useState("");
  const [seekingCollaborators, setSeekingCollaborators] = useState(false);
  const [sort, setSort] = useState("newest");

  const launches = useLaunches({
    q: q || undefined,
    product_type: productType || undefined,
    development_stage: developmentStage || undefined,
    stack: stack || undefined,
    seeking_collaborators: seekingCollaborators || undefined,
    sort,
    page: 1,
  });

  return (
    <div className="flex flex-col">
      {/* Page header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/90 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Launches</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Discover products, leave reviews, and collaborate with builders.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/launches/me"
              className="rounded-xl border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              My launches
            </Link>
            <Link
              href="/launches/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Launch
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <LaunchFilters
        q={q}
        onQChange={setQ}
        productType={productType}
        onProductTypeChange={setProductType}
        developmentStage={developmentStage}
        onDevelopmentStageChange={setDevelopmentStage}
        stack={stack}
        onStackChange={setStack}
        seekingCollaborators={seekingCollaborators}
        onSeekingCollaboratorsChange={setSeekingCollaborators}
        sort={sort}
        onSortChange={setSort}
      />

      {/* Launches grid */}
      <div className="p-4">
        {launches.loading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : launches.error ? (
          <p className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{launches.error}</p>
        ) : launches.launches.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
            <SparklesIcon className="h-10 w-10 text-zinc-700" />
            <p className="text-sm font-medium text-zinc-400">No launches match your filters.</p>
            <p className="text-xs text-zinc-600">Try adjusting the filters or be the first to launch something!</p>
            <Link
              href="/launches/new"
              className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Launch your product
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {launches.launches.map((launch) => (
              <LaunchCard key={launch.id} launch={launch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}