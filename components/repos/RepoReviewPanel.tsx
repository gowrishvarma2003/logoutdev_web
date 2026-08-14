"use client";

import Link from "next/link";
import { useRepoAiReviewSummary } from "@/lib/hooks/useRepos";
import type { Repository } from "@/lib/types";

function formatOutcome(outcome?: string | null) {
  const value = String(outcome || "pending").trim().toLowerCase();
  if (!value) return "Pending";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function shortCommit(commit?: string | null) {
  return commit ? commit.slice(0, 12) : "n/a";
}

export default function RepoReviewPanel({ repo }: { repo: Repository }) {
  const { summary, loading, error } = useRepoAiReviewSummary(repo.id);

  if (loading && !summary) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Trust Gate</p>
        <p className="mt-2 text-sm text-emerald-100/85">Loading the latest review decision for AI-generated changes.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200">Trust Gate</p>
        <p className="mt-2 text-sm text-rose-100/85">{error}</p>
      </div>
    );
  }

  if (!summary?.available || !summary.latest_review) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">Trust Gate</p>
        <h2 className="mt-2 text-lg font-semibold text-white">Review has not evaluated an AI patch yet</h2>
        <p className="mt-1 text-sm text-emerald-100/85">
          Once the Fix agent produces a change set, the Review agent will validate the real diff, block risky patches, and publish its decision here.
        </p>
      </div>
    );
  }

  const latest = summary.latest_review;
  const review = latest.review_summary;
  const findings = Array.isArray(review.findings) ? review.findings : [];
  const blockingFindings = findings.filter((finding) => finding.blocking).slice(0, 3);
  const blockedPreview = summary.blocked_change_sets.slice(0, 3);
  const approved = Boolean(review.approved);

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_45%),linear-gradient(135deg,rgba(6,78,59,0.96),rgba(24,24,27,0.98))] p-5 text-white shadow-[0_24px_80px_-32px_rgba(16,185,129,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300">Trust Gate</p>
          <h2 className="mt-2 text-2xl font-semibold">
            {approved ? "Latest AI fix cleared review" : "Latest AI fix is blocked for human trust"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-emerald-50/85">
            {review.summary || "The Review agent validates AI-generated diffs, reruns safety checks, and only approves patches that look safe to hand to humans."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-100/80">
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1">
              Outcome: {formatOutcome(review.outcome)}
            </span>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1">
              Confidence: {Math.round((review.confidence || 0) * 100)}%
            </span>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1">
              Risk: {formatOutcome(review.risk_level)}
            </span>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1">
              Reviewed commit: {shortCommit(review.reviewed_commit)}
            </span>
          </div>
        </div>

        <Link
          href={`/repos/${repo.id}/pulls`}
          className="rounded-xl border border-emerald-300/25 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-50 transition-colors hover:bg-white/15"
        >
          Open Pull Requests
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/35 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/75">Latest Review Decision</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">
                  Change set #{latest.number}
                  {latest.issue ? ` · ${latest.issue.issue_key}` : ""}
                </h3>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] ${approved ? "border-emerald-300/20 text-emerald-100/80" : "border-rose-300/20 text-rose-100/80"}`}>
                  {approved ? "approved" : "changes requested"}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-200/82">
                {latest.issue?.title || "AI-generated repository change"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-300/75">
                <span className="rounded-full border border-white/10 px-2.5 py-1">
                  Blocking findings: {latest.blocking_findings_count}
                </span>
                <span className="rounded-full border border-white/10 px-2.5 py-1">
                  Attempt: {review.attempt_count || latest.attempt_count || 0}
                </span>
                <span className="rounded-full border border-white/10 px-2.5 py-1">
                  PR review: {review.pr_review_published ? "published" : "not published"}
                </span>
                <span className="rounded-full border border-white/10 px-2.5 py-1">
                  Auto retry: {review.auto_retry_scheduled ? "scheduled" : "not scheduled"}
                </span>
              </div>
            </div>

            {blockingFindings.length ? blockingFindings.map((finding, index) => (
              <div key={`${finding.path || "finding"}-${finding.line || index}`} className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">{finding.message}</h3>
                  <span className="rounded-full border border-rose-300/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-rose-100/75">
                    {finding.severity}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-200/82">
                  {finding.suggestion || "Review flagged this as a blocking problem that the Fix agent must address before humans should see the patch."}
                </p>
                {finding.path ? (
                  <p className="mt-2 text-xs font-mono text-zinc-400">
                    {finding.path}
                    {finding.line ? `:${finding.line}` : ""}
                  </p>
                ) : null}
              </div>
            )) : (
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <p className="text-sm text-zinc-200/82">
                  No blocking findings are recorded on the latest review result.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/75">Review Queue</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">Blocked change sets</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.blocked_change_sets.length}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-zinc-400">Pending retries</p>
                <p className="mt-2 text-2xl font-semibold text-white">{summary.pending_retry_count}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-950/35 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/75">Recently Blocked</p>
            <div className="mt-3 space-y-3">
              {blockedPreview.length ? blockedPreview.map((changeSet) => (
                <div key={changeSet.id} className="rounded-2xl border border-white/8 bg-white/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      Change set #{changeSet.number}
                      {changeSet.issue ? ` · ${changeSet.issue.issue_key}` : ""}
                    </h3>
                    <span className="rounded-full border border-amber-300/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-amber-100/75">
                      {formatOutcome(changeSet.latest_review_decision || changeSet.review_summary.outcome)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-200/82">
                    {changeSet.review_summary.summary || changeSet.issue?.title || "Review is waiting for another fix attempt or human triage."}
                  </p>
                </div>
              )) : (
                <p className="text-sm text-zinc-300/75">No blocked change sets are currently waiting for follow-up.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
