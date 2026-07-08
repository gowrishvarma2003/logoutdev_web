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
      className="group block rounded-2xl border border-border-default bg-surface/60 p-5 transition-colors hover:border-border-strong hover:bg-surface"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-text-primary group-hover:text-sky-400">
              {project.title}
            </h3>
            <ProposalStatusBadge status={project.status} />
          </div>
          {project.client && (
            <p className="text-xs text-text-disabled">
              Posted by {project.client.name} • {formatRelativeTime(project.created_at)}
            </p>
          )}
        </div>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-text-disabled group-hover:text-text-secondary" />
      </div>

      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-text-muted">
        {project.summary}
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {(project.skills ?? []).slice(0, 5).map((skill) => (
          <span
            key={skill.id}
            className="rounded-md bg-surface-hover px-2 py-1 text-[11px] font-medium text-text-secondary"
          >
            {skill.skill}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-text-disabled">
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
