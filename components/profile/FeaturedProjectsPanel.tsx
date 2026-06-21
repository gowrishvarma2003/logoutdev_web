"use client";

/**
 * FeaturedProjectsPanel — up to 3 pinned project cards.
 * Links to /spaces/:id for each featured project.
 */

import Link from "next/link";
import type { UserFeaturedProject } from "@/lib/types";
import { StatusBadge } from "@/components/spaces/SpaceBadges";
import { RocketIcon, ChevronRightIcon, SparklesIcon } from "@/components/ui/Icons";

interface FeaturedProjectsPanelProps {
  projects: UserFeaturedProject[];
  showEmpty?: boolean;
}

export default function FeaturedProjectsPanel({
  projects,
  showEmpty = false,
}: FeaturedProjectsPanelProps) {
  if (projects.length === 0 && !showEmpty) return null;

  return (
    <section aria-label="Featured projects" id="featured">
      <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-1.5">
        <span className="w-1 h-3.5 rounded-full bg-sky-500 inline-block" />
        Featured Projects
      </h2>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center mx-auto mb-2">
            <SparklesIcon className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-sm text-zinc-500">
            No featured projects yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {projects.map(({ id, space }) => (
            <Link
              key={id}
              href={`/spaces/${space.id}`}
              className="group flex items-start gap-3 p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-zinc-700 flex items-center justify-center text-sm font-bold text-white shrink-0 mt-0.5">
                {space.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors truncate">
                    {space.name}
                  </p>
                  <StatusBadge status={space.status as "idea" | "building" | "shipping" | "paused" | "archived"} />
                </div>
                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                  {space.summary}
                </p>
                {space.owner ? (
                  <p className="text-[11px] text-zinc-600 mt-1.5 flex items-center gap-1">
                    <RocketIcon className="w-3 h-3" />
                    by {space.owner.name}
                  </p>
                ) : null}
              </div>

              <ChevronRightIcon className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
