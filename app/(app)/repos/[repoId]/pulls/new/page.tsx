"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRepoContext } from "../../layout";
import { useBranches, usePullRequestCompare, usePullRequestHeadOptions } from "@/lib/hooks/useRepos";
import { createPullRequest } from "@/lib/services/reposApi";
import Spinner from "@/components/ui/Spinner";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";

export default function NewPullRequestPage() {
  const { repo } = useRepoContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    options,
    loading: optionsLoading,
    error: optionsError,
  } = usePullRequestHeadOptions(repo.id);
  const { branches } = useBranches(repo.id);

  const initialHeadRepoId = searchParams.get("head_repo_id") || "";
  const initialHeadBranch = searchParams.get("head_branch") || "";
  const initialBaseBranch = searchParams.get("base_branch") || "";

  const [headRepoId, setHeadRepoId] = useState("");
  const [baseBranch, setBaseBranch] = useState("");
  const [headBranch, setHeadBranch] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedHeadRepoId = useMemo(() => {
    if (headRepoId && options.some((option) => option.repo_id === headRepoId)) {
      return headRepoId;
    }
    if (initialHeadRepoId && options.some((option) => option.repo_id === initialHeadRepoId)) {
      return initialHeadRepoId;
    }
    return options[0]?.repo_id || "";
  }, [headRepoId, initialHeadRepoId, options]);

  const selectedBaseBranch = useMemo(() => baseBranch || initialBaseBranch || repo.default_branch, [
    baseBranch,
    initialBaseBranch,
    repo.default_branch,
  ]);

  const selectedHeadOption = useMemo(
    () => options.find((option) => option.repo_id === selectedHeadRepoId) || null,
    [options, selectedHeadRepoId]
  );

  const selectedHeadBranch = useMemo(() => {
    if (!selectedHeadOption) return "";
    const availableBranches = selectedHeadOption.writable_branches || [];
    if (headBranch && availableBranches.includes(headBranch)) {
      return headBranch;
    }
    if (initialHeadBranch && availableBranches.includes(initialHeadBranch)) {
      return initialHeadBranch;
    }
    return availableBranches.find((branch) => branch !== selectedHeadOption.default_branch) || availableBranches[0] || "";
  }, [selectedHeadOption, headBranch, initialHeadBranch]);

  const { comparison, loading: compareLoading, error: compareError } = usePullRequestCompare(repo.id, {
    base_branch: selectedBaseBranch,
    head_branch: selectedHeadBranch,
    head_repo_id: selectedHeadRepoId || undefined,
  });

  const canCreate = Boolean(
      title.trim() &&
      selectedHeadRepoId &&
      selectedBaseBranch &&
      selectedHeadBranch &&
      !compareLoading &&
      !compareError &&
      comparison &&
      !comparison.existing_open_pull_request &&
      comparison.base_branch_exists &&
      comparison.source_branch_exists &&
      comparison.mergeability_state !== "head_missing"
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canCreate) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const pullRequest = await createPullRequest(repo.id, {
        title: title.trim(),
        body,
        source_repo_id: selectedHeadRepoId,
        source_branch: selectedHeadBranch,
        target_branch: selectedBaseBranch,
        is_draft: isDraft,
      });
      router.push(`/repos/${repo.id}/pulls/${pullRequest.number}`);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create pull request");
      setIsSubmitting(false);
    }
  }

  if (optionsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (optionsError) {
    return <p className="text-sm text-rose-400">{optionsError}</p>;
  }

  if (options.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h1 className="text-xl font-semibold text-white">No writable branches available</h1>
        <p className="mt-2 text-sm text-zinc-400">
          To open a pull request, you need write access to this repository or a writable fork of it.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Open a pull request</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Compare a writable head branch against this repository and preview the diff before you open the PR.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 lg:grid-cols-[1fr_auto_1fr]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Base</p>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="text-sm font-medium text-white">{repo.owner?.username || repo.name}</p>
            <select
              value={selectedBaseBranch}
              onChange={(event) => setBaseBranch(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              {(branches.length > 0 ? branches.map((branch) => branch.name) : [repo.default_branch]).map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <ArrowsRightLeftIcon className="h-5 w-5 text-zinc-500" />
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Head</p>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <select
              value={selectedHeadRepoId}
              onChange={(event) => setHeadRepoId(event.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              {options.map((option) => (
                <option key={option.repo_id} value={option.repo_id}>
                  {option.owner_username}/{option.repo_name}{option.is_fork ? " (fork)" : ""}
                </option>
              ))}
            </select>
            <select
              value={selectedHeadBranch}
              onChange={(event) => setHeadBranch(event.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              {(selectedHeadOption?.writable_branches || []).map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Compare preview</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {comparison ? `${comparison.head_label} -> ${comparison.base_label}` : "Choose branches to compare"}
              </p>
            </div>
            {compareLoading ? <Spinner size="sm" /> : null}
          </div>

          {compareError ? (
            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
              {compareError}
            </div>
          ) : null}

          {comparison ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Ahead</p>
                  <p className="mt-2 text-xl font-semibold text-white">{comparison.ahead_by}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Behind</p>
                  <p className="mt-2 text-xl font-semibold text-white">{comparison.behind_by}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Commits</p>
                  <p className="mt-2 text-xl font-semibold text-white">{comparison.commits.length}</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Files</p>
                  <p className="mt-2 text-xl font-semibold text-white">{comparison.diff.stats.files_changed}</p>
                </div>
              </div>

              {comparison.existing_open_pull_request ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                  An open pull request already exists for this branch pair.
                  <Link
                    href={`/repos/${repo.id}/pulls/${comparison.existing_open_pull_request.number}`}
                    className="ml-2 font-semibold text-amber-100 underline"
                  >
                    View #{comparison.existing_open_pull_request.number}
                  </Link>
                </div>
              ) : null}

              {comparison.blocking_reasons.length > 0 ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
                  {comparison.blocking_reasons.map((reason) => (
                    <p key={reason}>{reason}</p>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  This branch comparison is ready for a pull request.
                </div>
              )}

              <div className="rounded-xl border border-zinc-800 bg-zinc-950">
                <div className="border-b border-zinc-800 px-4 py-3 text-sm font-medium text-zinc-200">
                  Commits preview
                </div>
                <div className="divide-y divide-zinc-800">
                  {comparison.commits.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-zinc-500">No new commits in this comparison yet.</p>
                  ) : (
                    comparison.commits.slice(0, 5).map((commit) => (
                      <div key={commit.oid} className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{commit.message}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {commit.author_name} / {commit.short_oid}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-sm text-zinc-500">
              Select a base branch and a writable head branch to preview the pull request.
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">Pull request details</h2>
          {submitError ? (
            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
              {submitError}
            </div>
          ) : null}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            />
            <textarea
              rows={10}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Describe the changes, context, and anything reviewers should focus on."
              className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            />
            <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={isDraft}
                onChange={(event) => setIsDraft(event.target.checked)}
              />
              Create as draft
            </label>
            <button
              type="submit"
              disabled={!canCreate || isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
            >
              {isSubmitting ? <Spinner size="sm" /> : null}
              {isDraft ? "Create draft pull request" : "Create pull request"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
