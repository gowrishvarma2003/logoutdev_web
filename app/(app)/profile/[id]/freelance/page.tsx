"use client";

import { use } from "react";
import Link from "next/link";
import { useProfileFreelance } from "@/lib/hooks/useProfile";
import { ProfileListSkeleton } from "@/components/profile/ProfileSkeleton";
import { BoltIcon } from "@/components/ui/Icons";

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
      <div className="px-5 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
          <BoltIcon className="w-5 h-5 text-zinc-600" />
        </div>
        <p className="text-zinc-600 text-sm">No freelance outcomes yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 py-6">
      {client_projects.length > 0 ? (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3">
            Client-side projects
          </h2>
          <div className="space-y-3">
            {client_projects.map((project) => (
              <Link
                key={project.id}
                href={`/freelance/${project.id}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-white">{project.title}</p>
                  <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-400">{project.summary}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {wins.length > 0 ? (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-3">
            Freelance wins
          </h2>
          <div className="space-y-3">
            {wins.map((proposal) => (
              <Link
                key={proposal.id}
                href={proposal.project ? `/freelance/${proposal.project.id}` : "/freelance"}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <p className="text-sm font-semibold text-white">
                  {proposal.project?.title || "Accepted proposal"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
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
