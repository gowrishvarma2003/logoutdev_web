"use client";

import { useState } from "react";
import Link from "next/link";
import { useRepoContext } from "../layout";
import { useBranches } from "@/lib/hooks/useRepos";
import * as reposApi from "@/lib/services/reposApi";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { ArrowsRightLeftIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function RepoBranchesPage() {
  const { repo } = useRepoContext();
  const { branches, default_branch, loading, error, refetch } = useBranches(repo.id);

  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [startPoint, setStartPoint] = useState(default_branch || "main");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    setActionLoading(true);
    setActionError("");
    try {
      await reposApi.createBranch(repo.id, {
        name: newBranchName,
        start_point: startPoint,
      });
      setNewBranchName("");
      setIsCreating(false);
      refetch();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to create branch");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBranch = async (name: string) => {
    if (!confirm(`Are you sure you want to delete branch '${name}'?`)) return;

    try {
      await reposApi.deleteBranch(repo.id, name);
      refetch();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete branch");
    }
  };

  const sortedBranches = [...branches].sort((a, b) => {
    if (a.name === default_branch) return -1;
    if (b.name === default_branch) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Branches</h2>
          <p className="text-sm text-zinc-400">View and manage branches in this repository.</p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          <PlusIcon className="h-4 w-4" />
          New branch
        </button>
      </div>

      {isCreating && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <form onSubmit={handleCreateBranch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="branch-name" className="mb-1 block text-sm font-medium text-zinc-300">
                  Branch name
                </label>
                <input
                  id="branch-name"
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="e.g. feature/new-login"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>
              <div className="flex-1">
                <label htmlFor="start-point" className="mb-1 block text-sm font-medium text-zinc-300">
                  Source branch
                </label>
                <select
                  id="start-point"
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {branches.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {actionError && (
              <p className="text-sm text-rose-400">{actionError}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={actionLoading || !newBranchName.trim()}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? <Spinner size="sm" className="inline-block mr-2" /> : null}
                Create branch
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewBranchName("");
                  setActionError("");
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : null}

      {!loading && error ? <p className="px-4 py-10 text-center text-sm text-rose-400">{error}</p> : null}

      {!loading && !error && branches.length === 0 ? (
        <EmptyState
          icon={<ArrowsRightLeftIcon className="h-10 w-10" />}
          title="No branches found"
          description="Create a branch to start working on a new feature."
        />
      ) : null}

      {!loading && !error && branches.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm font-semibold text-white">
            {branches.length} {branches.length === 1 ? 'branch' : 'branches'}
          </div>
          <div className="divide-y divide-zinc-800/50">
            {sortedBranches.map((branch) => {
              const isDefault = branch.name === default_branch;

              return (
                <div key={branch.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-900/30 transition-colors">
                  <div className="flex flex-col min-w-0 gap-1.5">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/repos/${repo.id}?ref=${encodeURIComponent(branch.name)}`}
                        className="font-semibold text-blue-500 hover:underline break-words truncate"
                      >
                        {branch.name}
                      </Link>
                      {isDefault && (
                        <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                          Default
                        </span>
                      )}
                    </div>
                    {/* If we had latest commit data per branch we'd put it here */}
                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                      <Link href={`/repos/${repo.id}/commits/${branch.oid}`} className="hover:text-blue-400">
                        {branch.oid.substring(0, 7)}
                      </Link>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-3">
                    <Link
                      href={`/repos/${repo.id}?ref=${encodeURIComponent(branch.name)}`}
                      className="hidden sm:block text-xs text-zinc-400 hover:text-blue-400"
                    >
                      Browse files
                    </Link>
                    {!isDefault && (
                      <button
                        onClick={() => handleDeleteBranch(branch.name)}
                        className="rounded-md p-1.5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                        title="Delete branch"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
