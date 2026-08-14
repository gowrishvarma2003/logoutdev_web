"use client";

import Link from "next/link";
import { useRepoAiDetectionSummary } from "@/lib/hooks/useRepos";
import type { Repository } from "@/lib/types";

export default function RepoDetectionPanel({ repo }: { repo: Repository }) {
  const { summary, loading, error } = useRepoAiDetectionSummary(repo.id);

  if (loading && !summary) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">Issue Detection</p>
        <p className="mt-2 text-sm text-amber-50/85">Loading the latest QA and static-analysis summary.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200">Issue Detection</p>
        <p className="mt-2 text-sm text-rose-100/85">{error}</p>
      </div>
    );
  }

  if (!summary?.available || !summary.summary) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">Issue Detection</p>
        <h2 className="mt-2 text-lg font-semibold text-white">Detection has not published a run yet</h2>
        <p className="mt-1 text-sm text-amber-50/85">
          Once the Detection agent completes a scan, this panel will show analyzer results, issue counts, and the highest-risk open findings.
        </p>
      </div>
    );
  }

  const result = summary.summary;
  const analyzerCount = result.analyzers.completed.length + result.analyzers.failed.length + result.analyzers.skipped.length;
  const highRiskIssues = summary.high_risk_issues.slice(0, 3);

  return (
    <div className="rounded-3xl border border-amber-500/20 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_45%),linear-gradient(135deg,rgba(69,26,3,0.96),rgba(24,24,27,0.98))] p-5 text-white shadow-[0_24px_80px_-32px_rgba(251,191,36,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300">Issue Detection</p>
          <h2 className="mt-2 text-2xl font-semibold">Hybrid QA run on {result.mode.replace(/_/g, " ")}</h2>
          <p className="mt-2 text-sm leading-6 text-amber-50/85">
            The detector combined analyzers, rules, and AI reasoning to scan {result.analysis_paths_count} focused paths and track the highest-confidence repository issues.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-amber-100/80">
            <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1">
              Visible findings: {result.finding_counts.visible}
            </span>
            <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1">
              Run-only findings: {result.finding_counts.run_only}
            </span>
            <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1">
              Analyzers: {analyzerCount}
            </span>
            <span className="rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1">
              Sync updates: {result.sync.created || 0} new / {result.sync.updated || 0} updated
            </span>
          </div>
        </div>

        <Link
          href={`/repos/${repo.id}/issues`}
          className="rounded-xl border border-amber-300/25 bg-white/10 px-4 py-2 text-sm font-semibold text-amber-50 transition-colors hover:bg-white/15"
        >
          Open Repo Issues
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-zinc-950/35 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/75">Analyzer Summary</p>
          <div className="mt-3 space-y-3">
            {[...result.analyzers.completed, ...result.analyzers.failed, ...result.analyzers.skipped].slice(0, 4).map((analyzer) => (
              <div key={`${analyzer.name}-${analyzer.status}`} className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">{analyzer.name}</h3>
                  <span className="rounded-full border border-amber-300/15 px-2 py-0.5 text-[11px] text-amber-100/75">
                    {analyzer.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-200/82">
                  {analyzer.reason || `${analyzer.finding_count} finding(s) from deterministic analysis.`}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-950/35 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/75">Highest-Risk Open Issues</p>
          <div className="mt-3 space-y-3">
            {highRiskIssues.length ? highRiskIssues.map((issue) => (
              <div key={issue.id} className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">{issue.title}</h3>
                  <span className="rounded-full border border-rose-300/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-rose-100/75">
                    {issue.severity}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-200/82">{issue.classification || issue.type}</p>
                {issue.related_feature_title ? (
                  <p className="mt-1 text-xs text-zinc-400">Feature: {issue.related_feature_title}</p>
                ) : null}
              </div>
            )) : (
              <p className="text-sm text-zinc-300/75">No high-risk open issues are currently recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
