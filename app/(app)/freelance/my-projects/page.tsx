"use client";

import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import FreelanceProjectCard from "@/components/freelance/FreelanceProjectCard";
import { useMyFreelanceProjects } from "@/lib/hooks/useFreelance";
import * as freelanceApi from "@/lib/services/freelanceApi";

export default function MyFreelanceProjectsPage() {
  const { projects, loading, error, refetch } = useMyFreelanceProjects();

  async function updateStatus(projectId: string, status: string) {
    await freelanceApi.updateFreelanceProjectStatus(projectId, status);
    await refetch();
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Posted Projects</h1>
          <p className="mt-1 text-sm text-text-disabled">Manage your freelance listings and award flow.</p>
        </div>
        <Link href="/freelance/create" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          Post Project
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="space-y-3">
            <FreelanceProjectCard project={project} />
            <div className="flex flex-wrap gap-2 px-1">
              <Link href={`/freelance/${project.id}/edit`} className="rounded-xl border border-border-strong px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover">
                Edit
              </Link>
              <Link href={`/freelance/${project.id}/proposals`} className="rounded-xl border border-border-strong px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover">
                Proposal Inbox
              </Link>
              {project.linked_space_id && (
                <Link href={`/spaces/${project.linked_space_id}`} className="rounded-xl bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/20">
                  Workspace
                </Link>
              )}
              {project.status === "open" && (
                <button onClick={() => updateStatus(project.id, "in_review")} className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/20">
                  Move to review
                </button>
              )}
              {project.status === "in_review" && (
                <button onClick={() => updateStatus(project.id, "open")} className="rounded-xl bg-surface-hover px-3 py-2 text-sm font-semibold text-text-secondary hover:bg-surface-active">
                  Reopen
                </button>
              )}
              {project.status === "awarded" && (
                <button onClick={() => updateStatus(project.id, "completed")} className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20">
                  Mark completed
                </button>
              )}
              {(project.status === "open" || project.status === "in_review") && (
                <button onClick={() => updateStatus(project.id, "cancelled")} className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20">
                  Cancel listing
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
