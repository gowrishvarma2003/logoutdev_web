"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSpace, useContributors } from "@/lib/hooks/useSpaces";
import { useAttachments, useRepositoryList } from "@/lib/hooks/useRepos";
import * as spacesApi from "@/lib/services/spacesApi";
import * as cache from "@/lib/services/requestCache";
import * as reposApi from "@/lib/services/reposApi";
import { EmptyState, SectionHeader } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import {
  FolderIcon,
  PlusIcon,
  CodeBracketIcon,
  ClockIcon,
  CogIcon,
  ExternalLinkIcon,
  LinkIcon,
  ArrowUpIcon,
} from "@/components/ui/Icons";
import type { RepositoryVisibility } from "@/lib/types";

const LANGUAGE_COLORS: Record<string, string> = {
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  CSS: "#563d7c",
  Dart: "#00B4AB",
  Dockerfile: "#384d54",
  Go: "#00ADD8",
  HTML: "#e34c26",
  Java: "#b07219",
  JavaScript: "#f1e05a",
  Kotlin: "#A97BFF",
  Makefile: "#427819",
  PHP: "#4F5D95",
  Python: "#3572A5",
  Ruby: "#701516",
  Rust: "#dea584",
  SCSS: "#c6538c",
  SQL: "#e38c00",
  Shell: "#89e051",
  Swift: "#F05138",
  TypeScript: "#3178c6",
  Vue: "#41b883",
};

export default function ReposPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const { user } = useAuth();
  const { space } = useSpace(spaceId);
  const { contributors } = useContributors(spaceId);
  const { attachments, repos, loading, error, refetch } = useAttachments(spaceId);
  const { repos: candidateRepos } = useRepositoryList({ attached: false, page: 1, limit: 100 });

  const [showCreate, setShowCreate] = useState(false);
  const [showAttachExisting, setShowAttachExisting] = useState(false);
  const [showAttachExternal, setShowAttachExternal] = useState(false);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [visibility, setVisibility] = useState<RepositoryVisibility>("private");

  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [externalLabel, setExternalLabel] = useState("");
  const [formError, setFormError] = useState("");
  const [actioningAttachment, setActioningAttachment] = useState<string | null>(null);

  const currentMembership = useMemo(
    () => contributors.find((member) => member.user_id === user?.id) ?? null,
    [contributors, user?.id]
  );
  const canManage = space?.owner_id === user?.id || currentMembership?.role === "maintainer";

  const attachedRepoIds = new Set(repos.map((repo) => repo.id));
  const availableRepos = candidateRepos.filter((repo) => !attachedRepoIds.has(repo.id));

  async function handleCreateRepo(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setFormError("Repository name is required.");
      return;
    }

    setCreating(true);
    setFormError("");
    try {
      await reposApi.createRepository({
        name: name.trim(),
        description: description.trim() || undefined,
        default_branch: defaultBranch.trim() || "main",
        visibility,
        space_id: spaceId,
      });
      setName("");
      setDescription("");
      setDefaultBranch("main");
      setVisibility("private");
      setShowCreate(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to create repository.");
    } finally {
      setCreating(false);
    }
  }

  async function handleAttachExisting(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedRepoId) return;

    setCreating(true);
    setFormError("");
    try {
      await spacesApi.createAttachment(spaceId, { repo_id: selectedRepoId });
      cache.invalidateSpace(spaceId, "attachments");
      cache.invalidateSpace(spaceId, "overview");
      setSelectedRepoId("");
      setShowAttachExisting(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to attach repository.");
    } finally {
      setCreating(false);
    }
  }

  async function handleAttachExternal(event: React.FormEvent) {
    event.preventDefault();
    if (!externalUrl.trim()) return;

    setCreating(true);
    setFormError("");
    try {
      await spacesApi.createAttachment(spaceId, {
        external_url: externalUrl.trim(),
        label: externalLabel.trim() || undefined,
      });
      cache.invalidateSpace(spaceId, "attachments");
      cache.invalidateSpace(spaceId, "overview");
      setExternalUrl("");
      setExternalLabel("");
      setShowAttachExternal(false);
      refetch();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to attach external resource.");
    } finally {
      setCreating(false);
    }
  }

  async function handleAttachmentUpdate(
    attachmentId: string,
    body: Partial<{ position: number; is_primary: boolean }>
  ) {
    setActioningAttachment(attachmentId);
    try {
      await spacesApi.updateAttachment(spaceId, attachmentId, body);
      cache.invalidateSpace(spaceId, "attachments");
      refetch();
    } finally {
      setActioningAttachment(null);
    }
  }

  async function handleDetach(attachmentId: string) {
    if (!confirm("Detach this item from the space?")) return;
    setActioningAttachment(attachmentId);
    try {
      await spacesApi.deleteAttachment(spaceId, attachmentId);
      cache.invalidateSpace(spaceId, "attachments");
      cache.invalidateSpace(spaceId, "overview");
      refetch();
    } finally {
      setActioningAttachment(null);
    }
  }

  return (
    <div>
      <SectionHeader
        title="Repos"
        count={attachments.length}
        action={
          canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowCreate((value) => !value)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                New repo
              </button>
              <button
                onClick={() => setShowAttachExisting((value) => !value)}
                className="inline-flex items-center gap-1 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Attach repo
              </button>
              <button
                onClick={() => setShowAttachExternal((value) => !value)}
                className="inline-flex items-center gap-1 rounded-lg border border-border-strong px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-hover"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
                Attach link
              </button>
            </div>
          ) : undefined
        }
      />

      {showCreate ? (
        <form onSubmit={handleCreateRepo} className="space-y-3 border-b border-border-default px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Repository name"
              className="w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none"
            />
            <input
              type="text"
              value={defaultBranch}
              onChange={(event) => setDefaultBranch(event.target.value)}
              placeholder="main"
              className="w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none"
            />
          </div>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional description"
            rows={3}
            className="w-full resize-none rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none"
          />
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as RepositoryVisibility)}
            className="w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary focus:border-border-strong focus:outline-none"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          {formError ? <p className="text-sm text-rose-400">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create & attach"}
            </button>
          </div>
        </form>
      ) : null}

      {showAttachExisting ? (
        <form onSubmit={handleAttachExisting} className="space-y-3 border-b border-border-default px-4 py-4">
          <select
            value={selectedRepoId}
            onChange={(event) => setSelectedRepoId(event.target.value)}
            className="w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary focus:border-border-strong focus:outline-none"
          >
            <option value="">Select an existing repo</option>
            {availableRepos.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.name} · {repo.visibility}
              </option>
            ))}
          </select>
          {formError ? <p className="text-sm text-rose-400">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAttachExisting(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !selectedRepoId}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {creating ? "Attaching..." : "Attach repo"}
            </button>
          </div>
        </form>
      ) : null}

      {showAttachExternal ? (
        <form onSubmit={handleAttachExternal} className="space-y-3 border-b border-border-default px-4 py-4">
          <input
            type="url"
            value={externalUrl}
            onChange={(event) => setExternalUrl(event.target.value)}
            placeholder="https://github.com/org/repo or docs link"
            className="w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none"
          />
          <input
            type="text"
            value={externalLabel}
            onChange={(event) => setExternalLabel(event.target.value)}
            placeholder="Optional label"
            className="w-full rounded-xl border border-border-default bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none"
          />
          {formError ? <p className="text-sm text-rose-400">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAttachExternal(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !externalUrl.trim()}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {creating ? "Attaching..." : "Attach link"}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-14">
          <Spinner />
        </div>
      ) : null}

      {!loading && error ? <p className="px-4 py-10 text-center text-sm text-rose-400">{error}</p> : null}

      {!loading && !error && attachments.length === 0 ? (
        <EmptyState
          icon={<FolderIcon className="w-10 h-10" />}
          title={canManage ? "No repos or resources yet" : "Nothing attached yet"}
          description={
            canManage
              ? "Create a new repo or attach existing code and external links so this space becomes the project hub."
              : "This space has not attached any repos or external project resources yet."
          }
        />
      ) : null}

      {!loading && !error && attachments.length > 0 ? (
        <div className="divide-y divide-border-default/60">
          {attachments.map((attachment, index) => (
            <div key={attachment.id} className="px-4 py-4 transition-colors hover:bg-surface/30">
              {attachment.repo ? (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-text-primary">{attachment.repo.name}</h3>
                      <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[11px] text-text-muted">
                        {attachment.repo.default_branch}
                      </span>
                      <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium uppercase text-sky-400">
                        {attachment.repo.visibility}
                      </span>
                      {attachment.is_primary ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                          Primary
                        </span>
                      ) : null}
                    </div>
                    {attachment.repo.description ? (
                      <p className="mt-1 text-sm text-text-muted">{attachment.repo.description}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-disabled">
                      {attachment.repo.language ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-text-muted">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: LANGUAGE_COLORS[attachment.repo.language] || "#8b949e" }}
                          />
                          {attachment.repo.language}
                        </span>
                      ) : null}
                      <span>
                        Created {new Date(attachment.repo.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="rounded-full border border-border-default px-2 py-0.5 text-[11px] uppercase tracking-wide text-text-muted">
                        Role {attachment.repo.my_role ?? "read"}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Link
                      href={`/repos/${attachment.repo.id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-surface-hover px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-active"
                    >
                      <CodeBracketIcon className="h-3.5 w-3.5" />
                      Code
                    </Link>
                    <Link
                      href={`/repos/${attachment.repo.id}/commits`}
                      className="inline-flex items-center gap-1 rounded-lg bg-surface-hover px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-active"
                    >
                      <ClockIcon className="h-3.5 w-3.5" />
                      Commits
                    </Link>
                    <Link
                      href={`/repos/${attachment.repo.id}/pulls`}
                      className="inline-flex items-center gap-1 rounded-lg bg-surface-hover px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-active"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      Pull Requests
                    </Link>
                    {canManage ? (
                      <>
                        <Link
                          href={`/repos/${attachment.repo.id}/settings`}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
                        >
                          <CogIcon className="h-3.5 w-3.5" />
                          Settings
                        </Link>
                        {!attachment.is_primary ? (
                          <button
                            onClick={() => handleAttachmentUpdate(attachment.id, { is_primary: true })}
                            disabled={actioningAttachment === attachment.id}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                          >
                            Set primary
                          </button>
                        ) : null}
                        {index > 0 ? (
                          <button
                            onClick={() => handleAttachmentUpdate(attachment.id, { position: index - 1 })}
                            disabled={actioningAttachment === attachment.id}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
                          >
                            <ArrowUpIcon className="h-3.5 w-3.5" />
                            Move up
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDetach(attachment.id)}
                          disabled={actioningAttachment === attachment.id}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                        >
                          Detach
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-text-primary">{attachment.label || attachment.external_url}</h3>
                      {attachment.is_primary ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                          Primary
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-text-muted">{attachment.external_url}</p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <a
                      href={attachment.external_url ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-surface-hover px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-active"
                    >
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                      Open
                    </a>
                    {canManage ? (
                      <>
                        {!attachment.is_primary ? (
                          <button
                            onClick={() => handleAttachmentUpdate(attachment.id, { is_primary: true })}
                            disabled={actioningAttachment === attachment.id}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                          >
                            Set primary
                          </button>
                        ) : null}
                        {index > 0 ? (
                          <button
                            onClick={() => handleAttachmentUpdate(attachment.id, { position: index - 1 })}
                            disabled={actioningAttachment === attachment.id}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
                          >
                            <ArrowUpIcon className="h-3.5 w-3.5" />
                            Move up
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDetach(attachment.id)}
                          disabled={actioningAttachment === attachment.id}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                        >
                          Detach
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
