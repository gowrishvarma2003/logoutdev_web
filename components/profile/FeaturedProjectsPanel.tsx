"use client";

/**
 * FeaturedProjectsPanel — up to 3 pinned project cards.
 * Links to /spaces/:id for each featured project.
 */

import Link from "next/link";
import type { UserFeaturedProject } from "@/lib/types";
import { StatusBadge } from "@/components/spaces/SpaceBadges";
import { RocketIcon, ChevronRightIcon, SparklesIcon } from "@/components/ui/Icons";
import EmptyState from "@/components/ui/EmptyState";

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
      <h2 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-1.5">
        <span className="w-1 h-3.5 rounded-full bg-sky-500 inline-block" />
        Featured Projects
      </h2>

      {projects.length === 0 ? (
        <EmptyState
          icon={<SparklesIcon className="h-6 w-6" />}
          title="No featured projects yet"
          description="Pin up to three spaces so visitors see the work you care about first."
          tone="project"
          size="sm"
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {projects.map(({ id, space }) => (
            <Link
              key={id}
              href={`/spaces/${space.id}`}
              className="group flex items-start gap-3 p-3.5 rounded-xl border border-border-default bg-surface/50 hover:border-border-strong hover:bg-surface transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 border border-border-strong flex items-center justify-center text-sm font-bold text-text-primary shrink-0 mt-0.5">
                {space.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold text-text-primary group-hover:text-sky-400 transition-colors truncate">
                    {space.name}
                  </p>
                  <StatusBadge status={space.status as "idea" | "building" | "shipping" | "paused" | "archived"} />
                </div>
                <p className="text-xs text-text-disabled line-clamp-2 leading-relaxed">
                  {space.summary}
                </p>
                {space.owner ? (
                  <p className="text-[11px] text-text-disabled mt-1.5 flex items-center gap-1">
                    <RocketIcon className="w-3 h-3" />
                    by {space.owner.name}
                  </p>
                ) : null}
              </div>

              <ChevronRightIcon className="w-4 h-4 text-text-disabled group-hover:text-text-muted transition-colors mt-1 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
