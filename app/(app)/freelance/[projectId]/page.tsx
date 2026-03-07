"use client";

import { use, useState } from "react";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import ProposalForm from "@/components/freelance/ProposalForm";
import ProposalStatusBadge from "@/components/freelance/ProposalStatusBadge";
import { useFreelanceProject } from "@/lib/hooks/useFreelance";
import { useAuth } from "@/lib/hooks/useAuth";
import * as freelanceApi from "@/lib/services/freelanceApi";
import { formatCurrencyFromCents } from "@/lib/utils";
import { ArrowLeftIcon, CalendarIcon, MapPinIcon, BoltIcon } from "@/components/ui/Icons";

type ProposalPayload = {
  cover_note: string;
  pricing_model: "fixed" | "hourly";
  bid_amount_cents: number;
  estimated_duration_weeks: number | null;
  availability_hours: number | null;
  proof_links: string[];
};

export default function FreelanceProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { user } = useAuth();
  const { project, loading, error, refetch } = useFreelanceProject(projectId);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);

  async function handleProposalSubmit(payload: ProposalPayload) {
    setProposalLoading(true);
    setProposalError(null);
    try {
      await freelanceApi.createProposal(projectId, payload);
      await refetch();
    } catch (err: unknown) {
      setProposalError(err instanceof Error ? err.message : "Failed to submit proposal");
    } finally {
      setProposalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return <p className="p-4 text-sm text-rose-400">{error || "Project not found."}</p>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <Link
        href="/explore"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Explore
      </Link>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{project.title}</h1>
              <ProposalStatusBadge status={project.status} />
            </div>
            <p className="text-sm text-zinc-400">{project.summary}</p>
            {project.client && (
              <p className="mt-2 text-xs text-zinc-500">
                Client: {project.client.name}
                {project.client.headline ? ` • ${project.client.headline}` : ""}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {project.viewer_state?.is_owner && (
              <>
                <Link href={`/freelance/${project.id}/edit`} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                  Edit Project
                </Link>
                <Link href={`/freelance/${project.id}/proposals`} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100">
                  View Proposals
                </Link>
              </>
            )}
            {(project.viewer_state?.can_open_workspace || project.linked_space_id) && (
              <Link href={`/spaces/${project.linked_space_id}`} className="rounded-xl bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/20">
                Open Workspace
              </Link>
            )}
          </div>
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:grid-cols-3">
          <div className="text-sm text-zinc-400">
            <p className="mb-1 text-xs uppercase tracking-wide text-zinc-600">Budget</p>
            <p className="inline-flex items-center gap-1.5 text-white">
              <BoltIcon className="h-4 w-4 text-zinc-500" />
              {formatCurrencyFromCents(project.budget_min_cents, project.currency_code)} - {formatCurrencyFromCents(project.budget_max_cents, project.currency_code)}
              {project.pricing_model === "hourly" ? "/hr" : ""}
            </p>
          </div>
          <div className="text-sm text-zinc-400">
            <p className="mb-1 text-xs uppercase tracking-wide text-zinc-600">Engagement</p>
            <p className="inline-flex items-center gap-1.5 text-white">
              <CalendarIcon className="h-4 w-4 text-zinc-500" />
              {project.engagement_type === "ongoing" ? "Ongoing" : `${project.duration_weeks || "Flexible"} weeks`}
            </p>
          </div>
          <div className="text-sm text-zinc-400">
            <p className="mb-1 text-xs uppercase tracking-wide text-zinc-600">Location</p>
            <p className="inline-flex items-center gap-1.5 text-white">
              <MapPinIcon className="h-4 w-4 text-zinc-500" />
              {project.location_mode}{project.timezone_note ? ` • ${project.timezone_note}` : ""}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {(project.skills ?? []).map((skill) => (
            <span
              key={skill.id}
              className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300"
            >
              {skill.skill}
            </span>
          ))}
        </div>

        <div className="prose prose-invert max-w-none prose-p:text-zinc-300">
          <p>{project.description}</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-bold text-white">Apply to this project</h2>

        {!user && (
          <div className="mt-3">
            <p className="text-sm text-zinc-400">Sign in to submit a proposal and track your application.</p>
            <div className="mt-4 flex gap-2">
              <Link href="/login" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100">
                Create account
              </Link>
            </div>
          </div>
        )}

        {user && project.viewer_state?.is_owner && (
          <p className="mt-3 text-sm text-zinc-400">
            You posted this project. Use the proposal inbox to shortlist or award a freelancer.
          </p>
        )}

        {user && !project.viewer_state?.is_owner && project.viewer_state?.has_submitted_proposal && (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-white">Your proposal is in.</p>
              {project.viewer_state.my_proposal_status ? (
                <ProposalStatusBadge status={project.viewer_state.my_proposal_status} />
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/freelance/my-proposals" className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
                View my proposals
              </Link>
              {project.viewer_state.can_open_workspace && (
                <Link href={`/spaces/${project.linked_space_id}`} className="rounded-xl bg-sky-500/15 px-3 py-2 text-sm font-semibold text-sky-300 hover:bg-sky-500/20">
                  Open workspace
                </Link>
              )}
            </div>
          </div>
        )}

        {user && !project.viewer_state?.is_owner && project.viewer_state?.can_submit_proposal && (
          <div className="mt-4">
            <ProposalForm
              pricingModel={project.pricing_model}
              submitLabel="Submit Proposal"
              loading={proposalLoading}
              error={proposalError}
              onSubmit={handleProposalSubmit}
            />
          </div>
        )}

        {user && !project.viewer_state?.is_owner && !project.viewer_state?.can_submit_proposal && !project.viewer_state?.has_submitted_proposal && (
          <p className="mt-3 text-sm text-zinc-400">This project is not accepting new proposals right now.</p>
        )}
      </div>
    </div>
  );
}
