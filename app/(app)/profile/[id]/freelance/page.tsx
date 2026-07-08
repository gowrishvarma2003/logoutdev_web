"use client";

import { use } from "react";
import Link from "next/link";
import { useProfileFreelance } from "@/lib/hooks/useProfile";
import { ProfileListSkeleton } from "@/components/profile/ProfileSkeleton";
import { BoltIcon } from "@/components/ui/Icons";
import EmptyState from "@/components/ui/EmptyState";

export default function ProfileFreelancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { client_projects, wins, loading, error } = useProfileFreelance(id);

  if (loading) {
    return <ProfileListSkeleton rows={4} />;
  }

  if (error) {
    return <p className="px-5 py-10 text-sm text-rose-400">{error}</p>;
  }

  if (client_projects.length === 0 && wins.length === 0) {
    return (
      <div className="p-5">
        <EmptyState
          icon={<BoltIcon className="h-7 w-7" />}
          title="No freelance outcomes yet"
          description="Posted projects and won proposals will appear here once freelance work starts landing."
          tone="project"
          action={
            <Link href="/freelance" className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">
              Browse freelance
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 py-6">
      {client_projects.length > 0 ? (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-disabled mb-3">
            Client-side projects
          </h2>
          <div className="space-y-3">
            {client_projects.map((project) => (
              <Link
                key={project.id}
                href={`/freelance/${project.id}`}
                className="block rounded-2xl border border-border-default bg-surface/60 p-4 transition-colors hover:border-border-strong hover:bg-surface"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-text-primary">{project.title}</p>
                  <span className="rounded-full border border-border-strong px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-text-muted">{project.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {wins.length > 0 ? (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-disabled mb-3">
            Freelance wins
          </h2>
          <div className="space-y-3">
            {wins.map((proposal) => (
              <Link
                key={proposal.id}
                href={proposal.project ? `/freelance/${proposal.project.id}` : "/freelance"}
                className="block rounded-2xl border border-border-default bg-surface/60 p-4 transition-colors hover:border-border-strong hover:bg-surface"
              >
                <p className="text-sm font-semibold text-text-primary">
                  {proposal.project?.title || "Accepted proposal"}
                </p>
                <p className="mt-1 text-xs text-text-disabled">
                  {proposal.project?.linked_space_id ? "Workspace created" : "Accepted proposal"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
