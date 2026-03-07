"use client";

import { use } from "react";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import ProposalInboxCard from "@/components/freelance/ProposalInboxCard";
import { useFreelanceProject, useProjectProposals } from "@/lib/hooks/useFreelance";
import * as freelanceApi from "@/lib/services/freelanceApi";
import { ArrowLeftIcon } from "@/components/ui/Icons";

export default function FreelanceProjectProposalsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { project, loading: projectLoading, error: projectError, refetch: refetchProject } = useFreelanceProject(projectId);
  const { proposals, loading, error, refetch } = useProjectProposals(projectId);

  async function handleAction(proposalId: string, action: "shortlist" | "reject" | "accept") {
    await freelanceApi.reviewProposal(projectId, proposalId, action);
    await Promise.all([refetch(), refetchProject()]);
  }

  if (projectLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (projectError || !project) {
    return <p className="p-4 text-sm text-rose-400">{projectError || "Project not found."}</p>;
  }

  if (!project.viewer_state?.can_view_proposals) {
    return <p className="p-4 text-sm text-zinc-400">Only the client can access this proposal inbox.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <Link
        href={`/freelance/${projectId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Project
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Proposal Inbox</h1>
          <p className="mt-1 text-sm text-zinc-500">{project.title}</p>
        </div>
        {project.linked_space_id && (
          <Link href={`/spaces/${project.linked_space_id}`} className="rounded-xl bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/20">
            Open Workspace
          </Link>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}

      {!loading && !error && proposals.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
          <p className="text-sm text-zinc-400">No proposals have been submitted yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {proposals.map((proposal) => (
          <ProposalInboxCard
            key={proposal.id}
            proposal={proposal}
            actions={project.status === "open" || project.status === "in_review" ? (
              <>
                <button
                  onClick={() => handleAction(proposal.id, "shortlist")}
                  className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/20"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => handleAction(proposal.id, "reject")}
                  className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(proposal.id, "accept")}
                  className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20"
                >
                  Award + Create Workspace
                </button>
              </>
            ) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
