"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import ProposalStatusBadge from "./ProposalStatusBadge";
import { formatCurrencyFromCents, formatRelativeTime } from "@/lib/utils";
import type { FreelanceProposal } from "@/lib/types";
import { useProfileSignals } from "@/lib/hooks/useProfile";
import { AwardIcon, ClockIcon, ExternalLinkIcon } from "@/components/ui/Icons";

export default function ProposalInboxCard({
  proposal,
  actions,
}: {
  proposal: FreelanceProposal;
  actions?: React.ReactNode;
}) {
  const profileSlug = proposal.freelancer?.username || proposal.freelancer?.id || "";
  const { signals } = useProfileSignals(profileSlug);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar user={proposal.freelancer} size="md" />
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-white">
                {proposal.freelancer?.name || "Freelancer"}
              </p>
              <ProposalStatusBadge status={proposal.status} />
            </div>
            <p className="text-xs text-zinc-500">
              {proposal.freelancer?.headline || "No headline yet"} • {formatRelativeTime(proposal.created_at)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">
            {formatCurrencyFromCents(proposal.bid_amount_cents, proposal.currency_code)}
            {proposal.pricing_model === "hourly" ? "/hr" : ""}
          </p>
          {signals && (
            <p className="mt-1 text-[11px] text-zinc-500">
              Proof-of-work {signals.score}/100
            </p>
          )}
        </div>
      </div>

      <p className="mb-3 text-sm leading-relaxed text-zinc-300">{proposal.cover_note}</p>

      <div className="mb-3 flex flex-wrap gap-2 text-xs text-zinc-500">
        {proposal.estimated_duration_weeks ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1">
            <ClockIcon className="h-3.5 w-3.5" />
            {proposal.estimated_duration_weeks} weeks
          </span>
        ) : null}
        {proposal.availability_hours ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1">
            <AwardIcon className="h-3.5 w-3.5" />
            {proposal.availability_hours} hrs/week
          </span>
        ) : null}
      </div>

      {proposal.freelancer?.profile_skills && proposal.freelancer.profile_skills.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {proposal.freelancer.profile_skills.slice(0, 6).map((skill) => (
            <span
              key={skill.id}
              className="rounded-md bg-sky-500/10 px-2 py-1 text-[11px] font-medium text-sky-300"
            >
              {skill.skill}
            </span>
          ))}
        </div>
      )}

      {proposal.freelancer?.featured_projects && proposal.freelancer.featured_projects.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {proposal.freelancer.featured_projects.slice(0, 3).map((item) =>
            item.space ? (
              <Link
                key={item.id}
                href={`/spaces/${item.space.id}`}
                className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
                {item.space.name}
              </Link>
            ) : null
          )}
        </div>
      )}

      {proposal.proof_links.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {proposal.proof_links.map((link) => (
            <a
              key={link}
              href={link}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-zinc-400 underline decoration-zinc-700 underline-offset-2 hover:text-white"
            >
              {link}
            </a>
          ))}
        </div>
      )}

      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
