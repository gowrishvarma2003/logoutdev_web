"use client";

import { use, useMemo, useState } from "react";
import { useRepoAiIssues, useRepoAiProduct } from "@/lib/hooks/useRepos";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export default function RepoIssuesPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [classification, setClassification] = useState("");
  const [confidenceBand, setConfidenceBand] = useState("");
  const [featureId, setFeatureId] = useState("");
  const [source, setSource] = useState("");
  const [query, setQuery] = useState("");

  const { issues, loading, error } = useRepoAiIssues(repoId, {
    status: status || undefined,
    severity: severity || undefined,
    classification: classification || undefined,
    confidence_band: confidenceBand || undefined,
    related_feature_id: featureId || undefined,
    detection_source: source || undefined,
    q: query || undefined,
    limit: 100,
  });
  const { product } = useRepoAiProduct(repoId);

  const classifications = useMemo(
    () => Array.from(new Set(issues.map((issue) => issue.classification).filter(Boolean))).sort(),
    [issues]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<ExclamationTriangleIcon className="h-10 w-10" />}
        title="Repo issues unavailable"
        description={error}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h1 className="text-lg font-semibold text-white">Repository AI issues</h1>
        <p className="mt-1 text-sm text-zinc-400">
          High-confidence findings from the Detection agent, linked back to product context from the PM model.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white">
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="triaged">Triaged</option>
            <option value="fix_ready">Fix ready</option>
            <option value="resolved">Resolved</option>
            <option value="suppressed">Suppressed</option>
          </select>
          <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white">
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={classification} onChange={(event) => setClassification(event.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white">
            <option value="">All classifications</option>
            {classifications.map((item) => (
              <option key={item} value={item || ""}>{item}</option>
            ))}
          </select>
          <select value={confidenceBand} onChange={(event) => setConfidenceBand(event.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white">
            <option value="">All confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select value={featureId} onChange={(event) => setFeatureId(event.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white">
            <option value="">All features</option>
            {(product?.product_model?.features || []).map((feature) => (
              <option key={feature.id} value={feature.id}>{feature.title}</option>
            ))}
          </select>
          <select value={source} onChange={(event) => setSource(event.target.value)} className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white">
            <option value="">All sources</option>
            <option value="static">Static analyzers</option>
            <option value="heuristic">Heuristics</option>
            <option value="llm">AI reasoning</option>
          </select>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title, body, or issue key"
          className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
        />
      </div>

      {!issues.length ? (
        <EmptyState
          icon={<ExclamationTriangleIcon className="h-10 w-10" />}
          title="No repo AI issues match these filters"
          description="When the Detection agent publishes visible findings, they will appear here."
        />
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-zinc-300">
                      {issue.issue_key}
                    </span>
                    <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-rose-200">
                      {issue.severity}
                    </span>
                    <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-sky-200">
                      {issue.confidence_band} {Math.round(issue.confidence_score * 100)}%
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-white">{issue.title}</h2>
                  <p className="mt-1 text-sm text-zinc-300">{issue.body}</p>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <p>Status: {issue.status}</p>
                  <p>Sources: {issue.detection_sources.join(", ") || "n/a"}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Context</p>
                  <p className="mt-2 text-sm text-zinc-300">Classification: {issue.classification || issue.type}</p>
                  {issue.related_feature_title ? <p className="mt-1 text-sm text-zinc-300">Feature: {issue.related_feature_title}</p> : null}
                  {issue.related_module_id ? <p className="mt-1 text-sm text-zinc-300">Module: {issue.related_module_id}</p> : null}
                  {issue.impact ? <p className="mt-2 text-sm text-zinc-400">{issue.impact}</p> : null}
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">Evidence</p>
                  <div className="mt-2 space-y-2">
                    {issue.evidence.slice(0, 3).map((evidence, index) => (
                      <div key={`${issue.id}-${index}`} className="text-sm text-zinc-300">
                        <p className="font-mono text-xs text-zinc-400">
                          {evidence.path}
                          {evidence.line_start ? `:${evidence.line_start}` : ""}
                        </p>
                        {evidence.summary ? <p className="mt-1">{evidence.summary}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {issue.suggested_fix ? (
                <div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-300">Suggested fix</p>
                  <p className="mt-2 text-sm text-emerald-100/85">{issue.suggested_fix}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
