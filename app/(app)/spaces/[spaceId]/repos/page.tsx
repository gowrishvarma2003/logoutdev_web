"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSpace, useContributors } from "@/lib/hooks/useSpaces";
import { useRepos } from "@/lib/hooks/useRepos";
import * as api from "@/lib/services/spacesApi";
import { EmptyState, SectionHeader } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { FolderIcon, PlusIcon, CodeBracketIcon, ClockIcon, CogIcon } from "@/components/ui/Icons";

export default function ReposPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const { user } = useAuth();
  const { space } = useSpace(spaceId);
  const { contributors } = useContributors(spaceId);
  const { repos, loading, error, refetch } = useRepos(spaceId);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [formError, setFormError] = useState("");

  const currentMembership = useMemo(
    () => contributors.find((member) => member.user_id === user?.id) ?? null,
    [contributors, user?.id]
  );
  const canManage = space?.owner_id === user?.id || currentMembership?.role === "maintainer";

  async function handleCreateRepo(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Repository name is required.");
      return;
    }

    setCreating(true);
    setFormError("");
    try {
      await api.createRepo(spaceId, {
        name: name.trim(),
        description: description.trim() || undefined,
        default_branch: defaultBranch.trim() || "main",
      });
      setName("");
      setDescription("");
      setDefaultBranch("main");
      setShowCreate(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create repository.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <SectionHeader
        title="Repositories"
        count={repos.length}
        action={
          canManage ? (
            <button
              onClick={() => setShowCreate((v) => !v)}
              className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-100 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              New Repo
            </button>
          ) : undefined
        }
      />

      {showCreate && (
        <form onSubmit={handleCreateRepo} className="space-y-3 border-b border-zinc-800 px-4 py-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Repository name"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
          <input
            type="text"
            value={defaultBranch}
            onChange={(e) => setDefaultBranch(e.target.value)}
            placeholder="main"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
          {formError && <p className="text-sm text-rose-400">{formError}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating..." : "Create Repo"}
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className="flex justify-center py-14">
          <Spinner />
        </div>
      )}

      {!loading && error && (
        <p className="px-4 py-10 text-center text-sm text-rose-400">{error}</p>
      )}

      {!loading && !error && repos.length === 0 && (
        <EmptyState
          icon={<FolderIcon className="w-10 h-10" />}
          title={canManage ? "No repositories yet" : "No repository access yet"}
          description={
            canManage
              ? "Create the first private code repository for this space."
              : "A maintainer will need to grant you repo access before code appears here."
          }
        />
      )}

      {!loading && !error && repos.length > 0 && (
        <div className="divide-y divide-zinc-800/60">
          {repos.map((repo) => (
            <div key={repo.id} className="px-4 py-4 hover:bg-zinc-900/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="truncate text-sm font-semibold text-white">{repo.name}</h3>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                      {repo.default_branch}
                    </span>
                    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400 uppercase">
                      {repo.my_role ?? "read"}
                    </span>
                  </div>
                  {repo.description && (
                    <p className="mt-1 text-sm text-zinc-400">{repo.description}</p>
                  )}
                  <p className="mt-2 text-xs text-zinc-600">
                    Created {new Date(repo.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/spaces/${spaceId}/repos/${repo.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                  >
                    <CodeBracketIcon className="w-3.5 h-3.5" />
                    Code
                  </Link>
                  <Link
                    href={`/spaces/${spaceId}/repos/${repo.id}/commits`}
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                  >
                    <ClockIcon className="w-3.5 h-3.5" />
                    Commits
                  </Link>
                  {canManage && (
                    <Link
                      href={`/spaces/${spaceId}/repos/${repo.id}/settings`}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <CogIcon className="w-3.5 h-3.5" />
                      Settings
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
