"use client";

import { use } from "react";
import Link from "next/link";
import { useProfileFreelance } from "@/lib/hooks/useProfile";
import Spinner from "@/components/ui/Spinner";

export default function ProfileFreelancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { client_projects, wins, loading, error } = useProfileFreelance(id);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <p className="px-5 py-10 text-sm text-rose-400">{error}</p>;
  }

  if (client_projects.length === 0 && wins.length === 0) {
    return <p className="px-5 py-10 text-sm text-zinc-500">No freelance outcomes yet.</p>;
  }

  return (
    <div className="space-y-6 px-5 py-6">
      {client_projects.length > 0 ? (
        <section>
          <h2 className="text-base font-semibold text-white">Client-side projects</h2>
          <div className="mt-3 space-y-3">
            {client_projects.map((project) => (
              <Link
                key={project.id}
                href={`/freelance/${project.id}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:bg-zinc-900"
              >
                <p className="text-sm font-semibold text-white">{project.title}</p>
                <p className="mt-1 text-sm text-zinc-400">{project.summary}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">{project.status}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {wins.length > 0 ? (
        <section>
          <h2 className="text-base font-semibold text-white">Freelance wins</h2>
          <div className="mt-3 space-y-3">
            {wins.map((proposal) => (
              <Link
                key={proposal.id}
                href={proposal.project ? `/freelance/${proposal.project.id}` : "/freelance"}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:bg-zinc-900"
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
