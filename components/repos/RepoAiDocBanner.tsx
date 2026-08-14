"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RepoAiDocStatus, Repository } from "@/lib/types";
import * as reposApi from "@/lib/services/reposApi";
import { useAuth } from "@/lib/hooks/useAuth";

export default function RepoAiDocBanner({ repo }: { repo: Repository }) {
  const { user, isLoaded } = useAuth();
  const [status, setStatus] = useState<RepoAiDocStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const ensureKeyRef = useRef<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const nextStatus = await reposApi.getRepositoryAiDocStatus(repo.id);
      setStatus(nextStatus);
      setError(null);
      return nextStatus;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch AI product doc status.");
      return null;
    }
  }, [repo.id]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    ensureKeyRef.current = null;
  }, [repo.default_branch, repo.id]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const isActiveRun = Boolean(status && ["queued", "running"].includes(status.status));
    let ensureReason: string | null = null;
    if (!isActiveRun && ensureKeyRef.current === null) {
      ensureReason = "repo-opened";
    } else if (status && !isActiveRun && (status.is_stale || !status.has_document)) {
      ensureReason = [
        "stale-refresh",
        status.current_source_commit || status.source_commit || "unknown",
        status.document_source_commit || "no-doc",
      ].join(":");
    }

    if (!ensureReason) return;

    const ensureKey = [
      repo.id,
      repo.default_branch,
      ensureReason,
    ].join(":");
    if (ensureKeyRef.current === ensureKey) return;
    ensureKeyRef.current = ensureKey;

    void reposApi
      .ensureRepositoryAiDoc(repo.id, {
        source_branch: repo.default_branch,
        trigger: "repo_opened",
      })
      .then(() => loadStatus())
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to start AI product documentation.");
      });
  }, [repo.default_branch, repo.id, isLoaded, loadStatus, status, user]);

  useEffect(() => {
    if (!status || !["queued", "running"].includes(status.status)) return;
    const timer = window.setInterval(() => {
      void loadStatus();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [loadStatus, status]);

  async function handleRegenerate() {
    setIsRegenerating(true);
    setError(null);
    try {
      await reposApi.regenerateRepositoryAiDoc(repo.id, { source_branch: repo.default_branch });
      await loadStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to regenerate AI product documentation.";
      if (message.includes("no commits")) {
        setError("This repository has no commits yet. Push at least one commit before generating product documentation.");
      } else if (message.includes("unavailable")) {
        setError("The PM agent is temporarily unavailable. Please try again in a moment.");
      } else {
        setError(message);
      }
    } finally {
      setIsRegenerating(false);
    }
  }

  if (!status && !error) return null;
  if (status?.status === "idle" && !user && !error) return null;

  const aiBranch = status?.ai_branch || "logoutdev/ai-docs";
  const documentPath = status?.document_path || ".logoutdev/project-doc.md";
  const docHref = `/repos/${repo.id}?ref=${encodeURIComponent(aiBranch)}&path=${encodeURIComponent(documentPath)}&view=blob`;
  const isActiveRun = Boolean(status && ["queued", "running"].includes(status.status));
  const isStale = Boolean(status?.is_stale);
  const hasDocument = Boolean(status?.has_document);
  const currentSourceCommit = status?.current_source_commit || status?.source_commit;
  const documentSourceCommit = status?.document_source_commit;

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">AI Product Doc</p>
      <h2 className="mt-2 text-lg font-semibold text-white">
        {status?.status === "completed" && isStale
          ? "Generated product documentation is out of date"
          : status?.status === "completed"
          ? "Generated product documentation is available on the AI branch"
          : status?.status === "failed"
            ? "Product documentation generation failed"
            : status?.status === "idle"
              ? "Preparing AI-generated product documentation"
          : "Generating product documentation on the AI branch"}
      </h2>
      <p className="mt-1 text-sm text-emerald-100/90">
        The PM agent inside the AI Team reads this repository through signed MCP-backed tools and writes only to
        {" "}
        <span className="font-mono text-white">{aiBranch}</span>.
      </p>

      {currentSourceCommit ? (
        <p className="mt-3 text-xs text-emerald-100/70">Current source commit: {currentSourceCommit.slice(0, 12)}</p>
      ) : null}
      {documentSourceCommit ? (
        <p className="mt-1 text-xs text-emerald-100/70">Document source commit: {documentSourceCommit.slice(0, 12)}</p>
      ) : null}
      {status && hasDocument ? (
        <p className="mt-1 text-xs text-emerald-100/70">
          {isStale ? "Status: Out of date" : "Status: Current"}
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-rose-200">{error}</p> : null}
      {status?.last_error ? <p className="mt-3 text-sm text-rose-200">{status.last_error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {status?.status === "completed" ? (
          <Link
            href={docHref}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-50"
          >
            Open Product Doc
          </Link>
        ) : null}
        {user ? (
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isRegenerating || isActiveRun}
            className="rounded-lg border border-emerald-300/30 px-4 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-400/10 disabled:opacity-60"
          >
            {isActiveRun ? "Generating..." : isRegenerating ? "Regenerating..." : "Regenerate"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
