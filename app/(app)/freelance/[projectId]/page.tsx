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
import NextStepsPanel from "@/components/connected/NextStepsPanel";
import RelatedEntitiesPanel from "@/components/connected/RelatedEntitiesPanel";
import TrustContextCard from "@/components/connected/TrustContextCard";

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
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-text-disabled transition-colors hover:text-text-secondary"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Explore
      </Link>

      <div className="rounded-3xl border border-border-default bg-surface/50 p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">{project.title}</h1>
              <ProposalStatusBadge status={project.status} />
            </div>
            <p className="text-sm text-text-muted">{project.summary}</p>
            {project.client && (
              <p className="mt-2 text-xs text-text-disabled">
                Client: {project.client.name}
                {project.client.headline ? ` • ${project.client.headline}` : ""}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {project.viewer_state?.is_owner && (
              <>
                <Link href={`/freelance/${project.id}/edit`} className="rounded-xl border border-border-strong px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover">
                  Edit Project
                </Link>
                <Link href={`/freelance/${project.id}/proposals`} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
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

        <div className="mb-6 grid gap-3 rounded-2xl border border-border-default bg-app/60 p-4 sm:grid-cols-3">
          <div className="text-sm text-text-muted">
            <p className="mb-1 text-xs uppercase tracking-wide text-text-disabled">Budget</p>
            <p className="inline-flex items-center gap-1.5 text-text-primary">
              <BoltIcon className="h-4 w-4 text-text-disabled" />
              {formatCurrencyFromCents(project.budget_min_cents, project.currency_code)} - {formatCurrencyFromCents(project.budget_max_cents, project.currency_code)}
              {project.pricing_model === "hourly" ? "/hr" : ""}
            </p>
          </div>
          <div className="text-sm text-text-muted">
            <p className="mb-1 text-xs uppercase tracking-wide text-text-disabled">Engagement</p>
            <p className="inline-flex items-center gap-1.5 text-text-primary">
              <CalendarIcon className="h-4 w-4 text-text-disabled" />
              {project.engagement_type === "ongoing" ? "Ongoing" : `${project.duration_weeks || "Flexible"} weeks`}
            </p>
          </div>
          <div className="text-sm text-text-muted">
            <p className="mb-1 text-xs uppercase tracking-wide text-text-disabled">Location</p>
            <p className="inline-flex items-center gap-1.5 text-text-primary">
              <MapPinIcon className="h-4 w-4 text-text-disabled" />
              {project.location_mode}{project.timezone_note ? ` • ${project.timezone_note}` : ""}
            </p>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {(project.skills ?? []).map((skill) => (
            <span
              key={skill.id}
              className="rounded-md bg-surface-hover px-2.5 py-1 text-xs font-medium text-text-secondary"
            >
              {skill.skill}
            </span>
          ))}
        </div>

        <div className="prose prose-invert max-w-none prose-p:text-text-secondary">
          <p>{project.description}</p>
        </div>
      </div>

      {(project.trust_context || project.next_steps?.length || project.related_entities?.length) ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {project.trust_context ? <TrustContextCard trust={project.trust_context} /> : null}
          {project.next_steps ? <NextStepsPanel items={project.next_steps} /> : null}
          {project.related_entities ? (
            <div className="lg:col-span-2">
              <RelatedEntitiesPanel items={project.related_entities} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div id="apply" className="mt-6 rounded-3xl border border-border-default bg-surface/50 p-6">
        <h2 className="text-lg font-bold text-text-primary">Apply to this project</h2>

        {!user && (
          <div className="mt-3">
            <p className="text-sm text-text-muted">Sign in to submit a proposal and track your application.</p>
            <div className="mt-4 flex gap-2">
              <Link href="/login" className="rounded-xl border border-border-strong px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                Create account
              </Link>
            </div>
          </div>
        )}

        {user && project.viewer_state?.is_owner && (
          <p className="mt-3 text-sm text-text-muted">
            You posted this project. Use the proposal inbox to shortlist or award a freelancer.
          </p>
        )}

        {user && !project.viewer_state?.is_owner && project.viewer_state?.has_submitted_proposal && (
          <div className="mt-4 rounded-2xl border border-border-default bg-app/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-text-primary">Your proposal is in.</p>
              {project.viewer_state.my_proposal_status ? (
                <ProposalStatusBadge status={project.viewer_state.my_proposal_status} />
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/freelance/my-proposals" className="rounded-xl border border-border-strong px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover">
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
          <p className="mt-3 text-sm text-text-muted">This project is not accepting new proposals right now.</p>
        )}

        <div className="mt-4">
          <Link
            href={`/feed?shareType=freelance_project&shareId=${project.id}&shareTitle=${encodeURIComponent(project.title)}&shareSubtitle=${encodeURIComponent(project.summary || "")}&shareHref=${encodeURIComponent(`/freelance/${project.id}`)}`}
            className="inline-flex rounded-xl border border-border-strong px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover"
          >
            Share update
          </Link>
        </div>
      </div>
    </div>
  );
}
