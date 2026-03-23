"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRepoContext } from "../../layout";
import { useBranches } from "@/lib/hooks/useRepos";
import { createPullRequest } from "@/lib/services/reposApi";
import Spinner from "@/components/ui/Spinner";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";

export default function NewPullRequestPage() {
  const { repo } = useRepoContext();
  const router = useRouter();
  const { branches, loading: branchesLoading } = useBranches(repo.id);

  const [baseBranch, setBaseBranch] = useState("");
  const [compareBranch, setCompareBranch] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const derivedBaseBranch = repo.default_branch || branches[0]?.name || "";
  const derivedCompareBranch = branches.find((b) => !b.is_default)?.name || branches[0]?.name || "";
  const selectedBaseBranch = baseBranch || derivedBaseBranch;
  const selectedCompareBranch = compareBranch || derivedCompareBranch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBaseBranch || !selectedCompareBranch || !title) return;

    if (selectedBaseBranch === selectedCompareBranch) {
      setError("Base and compare branches must be different.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const pullRequest = await createPullRequest(repo.id, {
        title,
        body,
        source_branch: selectedCompareBranch,
        target_branch: selectedBaseBranch,
      });
      router.push(`/repos/${repo.id}/pulls/${pullRequest.number}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create pull request");
      setIsSubmitting(false);
    }
  };

  if (branchesLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Compare changes</h1>
      </div>
      <p className="mb-6 text-zinc-400">
        Choose two branches to see what&apos;s changed or to start a new pull request.
      </p>

      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-md border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">base:</span>
          <select
            value={selectedBaseBranch}
            onChange={(e) => setBaseBranch(e.target.value)}
            className="rounded bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {branches.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <ArrowsRightLeftIcon className="h-5 w-5 text-zinc-500" />

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">compare:</span>
          <select
            value={selectedCompareBranch}
            onChange={(e) => setCompareBranch(e.target.value)}
            className="rounded bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {branches.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {selectedBaseBranch === selectedCompareBranch && (
          <span className="text-sm text-yellow-500 ml-auto">
            Please select different branches to compare.
          </span>
        )}
      </div>

      <div className="flex gap-6">
        <div className="hidden sm:block">
          <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
            {/* User Avatar Placeholder */}
            <span className="text-zinc-500 text-sm">You</span>
          </div>
        </div>
        <div className="flex-1 rounded-md border border-zinc-700 bg-zinc-900 relative">
          <div className="border-b border-zinc-800 bg-zinc-800/80 px-4 py-3">
            <h2 className="text-sm font-medium text-zinc-200">Open a pull request</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
            {error && (
              <div className="rounded border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}
            <div>
              <input
                type="text"
                placeholder="Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <textarea
                rows={8}
                placeholder="Desciption..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono resize-y"
              />
            </div>
            <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting || selectedBaseBranch === selectedCompareBranch || !title}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
                {isSubmitting && <Spinner size="sm" />}
                Create pull request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
