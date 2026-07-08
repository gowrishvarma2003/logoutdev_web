"use client";

import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import ProposalStatusBadge from "@/components/freelance/ProposalStatusBadge";
import { useMyFreelanceProposals } from "@/lib/hooks/useFreelance";
import * as freelanceApi from "@/lib/services/freelanceApi";
import { formatCurrencyFromCents, formatRelativeTime } from "@/lib/utils";

export default function MyFreelanceProposalsPage() {
  const { proposals, loading, error, refetch } = useMyFreelanceProposals();

  async function handleWithdraw(projectId: string, proposalId: string) {
    await freelanceApi.withdrawProposal(projectId, proposalId);
    await refetch();
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">My Proposals</h1>
        <p className="mt-1 text-sm text-text-disabled">Track where you have applied and jump into awarded workspaces.</p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="space-y-4">
        {proposals.map((proposal) => (
          <div key={proposal.id} className="rounded-2xl border border-border-default bg-surface/60 p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {proposal.project?.title || "Untitled project"}
                  </h2>
                  <ProposalStatusBadge status={proposal.status} />
                </div>
                <p className="text-sm text-text-muted">{proposal.project?.summary}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text-primary">
                  {formatCurrencyFromCents(proposal.bid_amount_cents, proposal.currency_code)}
                  {proposal.pricing_model === "hourly" ? "/hr" : ""}
                </p>
                <p className="mt-1 text-xs text-text-disabled">{formatRelativeTime(proposal.updated_at)}</p>
              </div>
            </div>

            <p className="mb-4 line-clamp-3 text-sm text-text-secondary">{proposal.cover_note}</p>

            <div className="flex flex-wrap gap-2">
              <Link href={`/freelance/${proposal.project_id}`} className="rounded-xl border border-border-strong px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover">
                View Project
              </Link>
              {proposal.project?.linked_space_id && proposal.status === "accepted" && (
                <Link href={`/spaces/${proposal.project.linked_space_id}`} className="rounded-xl bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/20">
                  Open Workspace
                </Link>
              )}
              {(proposal.status === "submitted" || proposal.status === "shortlisted") && (
                <button
                  onClick={() => handleWithdraw(proposal.project_id, proposal.id)}
                  className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20"
                >
                  Withdraw
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
