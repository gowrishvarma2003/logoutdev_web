"use client";

import Link from "next/link";
import type { FreelanceProject } from "@/lib/types";
import { formatCurrencyFromCents, formatRelativeTime } from "@/lib/utils";
import { ChevronRightIcon, BoltIcon, CalendarIcon, MapPinIcon } from "@/components/ui/Icons";
import ProposalStatusBadge from "./ProposalStatusBadge";

export default function FreelanceProjectCard({
  project,
  href,
}: {
  project: FreelanceProject;
  href?: string;
}) {
  const targetHref = href || `/freelance/${project.id}`;

  return (
    <Link
      href={targetHref}
      className="group block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-white group-hover:text-sky-400">
              {project.title}
            </h3>
            <ProposalStatusBadge status={project.status} />
          </div>
          {project.client && (
            <p className="text-xs text-zinc-500">
              Posted by {project.client.name} • {formatRelativeTime(project.created_at)}
            </p>
          )}
        </div>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-600 group-hover:text-zinc-300" />
      </div>

      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-zinc-400">
        {project.summary}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(project.skills ?? []).slice(0, 5).map((skill) => (
          <span
            key={skill.id}
            className="rounded-md bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-300"
          >
            {skill.skill}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <BoltIcon className="h-3.5 w-3.5" />
          {formatCurrencyFromCents(project.budget_min_cents, project.currency_code)} - {formatCurrencyFromCents(project.budget_max_cents, project.currency_code)}
          {project.pricing_model === "hourly" ? "/hr" : ""}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarIcon className="h-3.5 w-3.5" />
          {project.engagement_type === "ongoing" ? "Ongoing" : `${project.duration_weeks || "Flexible"} weeks`}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPinIcon className="h-3.5 w-3.5" />
          {project.location_mode}
        </span>
      </div>
    </Link>
  );
}
