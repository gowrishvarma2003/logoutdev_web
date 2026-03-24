"use client";

import Link from "next/link";
import type { Repository } from "@/lib/types";

export default function RepoCollaborationBanner({
  repo,
  compact = false,
}: {
  repo: Repository;
  compact?: boolean;
}) {
  const attachedSpace = repo.attached_space;
  const collaborationHome = repo.collaboration_home;

  if (!attachedSpace || collaborationHome?.type !== "space") {
    return null;
  }

  return (
    <div className={`rounded-2xl border border-sky-500/20 bg-sky-500/10 ${compact ? "p-4" : "p-5"}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">Collaboration Home</p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Community discussion and project coordination live in {attachedSpace.name}
          </h2>
          <p className="mt-1 text-sm text-sky-100/90">
            Use this repo for code, pull requests, releases, and maintenance. Use the attached Space for discussions,
            work planning, updates, and contributor coordination.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/spaces/${attachedSpace.id}`}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-sky-950 transition-colors hover:bg-sky-50"
          >
            Open Space
          </Link>
          <Link
            href={`/spaces/${attachedSpace.id}/work`}
            className="rounded-lg border border-sky-300/30 px-4 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-400/10"
          >
            View Work
          </Link>
          <Link
            href={`/spaces/${attachedSpace.id}/discussions`}
            className="rounded-lg border border-sky-300/30 px-4 py-2 text-sm font-medium text-sky-100 transition-colors hover:bg-sky-400/10"
          >
            Discuss In Space
          </Link>
        </div>
      </div>
    </div>
  );
}
