"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSpace } from "@/lib/hooks/useSpaces";
import { useRepo, useRepoBlob, useRepoCommits, useRepoReadme, useRepoTree } from "@/lib/hooks/useRepos";
import { EmptyState, SectionHeader } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { CodeBracketIcon, FolderIcon, ClockIcon } from "@/components/ui/Icons";
import { formatFileSize, formatRelativeTime } from "@/lib/utils";

function getOrigin() {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configured) {
    const sanitized = configured.replace(/\/api\/?$/, "");
    if (typeof window !== "undefined" && window.location.protocol === "https:" && sanitized.startsWith("http://")) {
      return window.location.origin;
    }
    return sanitized;
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export default function RepoPage({
  params,
}: {
  params: Promise<{ spaceId: string; repoId: string }>;
}) {
  const { spaceId, repoId } = use(params);
  const searchParams = useSearchParams();
  const currentPath = searchParams.get("path") || "";
  const currentView = searchParams.get("view") || "tree";

  const { space } = useSpace(spaceId);
  const { repo, loading, error } = useRepo(spaceId, repoId);
  const directoryPath = currentView === "blob"
    ? currentPath.split("/").slice(0, -1).join("/")
    : currentPath;
  const activeRef = repo?.default_branch;

  const { entries, loading: treeLoading } = useRepoTree(spaceId, repoId, activeRef, directoryPath);
  const { blob, loading: blobLoading } = useRepoBlob(
    spaceId,
    repoId,
    activeRef,
    currentView === "blob" ? currentPath : undefined
  );
  const { readme } = useRepoReadme(spaceId, repoId, activeRef);
  const { commits } = useRepoCommits(spaceId, repoId, activeRef, undefined, 1);
  const [copied, setCopied] = useState(false);

  const breadcrumb = useMemo(() => {
    const parts = directoryPath ? directoryPath.split("/") : [];
    return parts.map((part, index) => ({
      name: part,
      path: parts.slice(0, index + 1).join("/"),
    }));
  }, [directoryPath]);

  const cloneUrl = repo
    ? `${getOrigin().replace(/\/$/, "")}/git/${space?.slug || spaceId}/${repo.slug}.git`
    : "";

  async function handleCopyClone() {
    if (!cloneUrl) return;
    await navigator.clipboard.writeText(cloneUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!repo || error) {
    return (
      <EmptyState
        icon={<FolderIcon className="w-10 h-10" />}
        title="Repository unavailable"
        description={error || "This repository is private or no longer exists."}
      />
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      <section className="px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-white">{repo.name}</h2>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
            {repo.default_branch}
          </span>
          <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium uppercase text-sky-400">
            {repo.my_role ?? "read"}
          </span>
        </div>
        {repo.description && <p className="mt-2 text-sm text-zinc-400">{repo.description}</p>}

        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Clone URL</p>
              <p className="truncate text-sm text-zinc-200">{cloneUrl}</p>
            </div>
            <button
              onClick={handleCopyClone}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-100 transition-colors"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Use a personal access token from{" "}
            <Link href="/settings/tokens" className="text-sky-400 hover:text-sky-300">
              Settings → Tokens
            </Link>{" "}
            as the password when cloning or pushing.
          </p>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Code"
          action={
            <Link
              href={`/spaces/${spaceId}/repos/${repoId}/commits`}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              View full history →
            </Link>
          }
        />

        <div className="px-4 py-3 text-xs text-zinc-500">
          <Link href={`/spaces/${spaceId}/repos/${repoId}`} className="hover:text-white transition-colors">
            root
          </Link>
          {breadcrumb.map((item) => (
            <span key={item.path}>
              {" / "}
              <Link
                href={`/spaces/${spaceId}/repos/${repoId}?path=${encodeURIComponent(item.path)}`}
                className="hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            </span>
          ))}
        </div>

        {treeLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : entries.length === 0 && currentView !== "blob" ? (
          <EmptyState
            icon={<CodeBracketIcon className="w-10 h-10" />}
            title="No files yet"
            description="This repository is empty. Push the first commit to start browsing code here."
          />
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {entries.map((entry) => {
              const href = entry.type === "tree"
                ? `/spaces/${spaceId}/repos/${repoId}?path=${encodeURIComponent(entry.path)}`
                : `/spaces/${spaceId}/repos/${repoId}?path=${encodeURIComponent(entry.path)}&view=blob`;

              return (
                <Link
                  key={entry.path}
                  href={href}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FolderIcon className={`w-4 h-4 ${entry.type === "tree" ? "text-amber-400" : "text-zinc-500"}`} />
                    <span className="truncate text-sm text-zinc-200">{entry.name}</span>
                  </div>
                  <span className="text-[11px] uppercase tracking-wide text-zinc-600">{entry.type}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {currentView === "blob" && currentPath && (
        <section>
          <SectionHeader title={currentPath.split("/").pop() || "File"} />
          {blobLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : blob ? (
            <div className="px-4 py-4">
              <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
                <span>{blob.path}</span>
                <span>{formatFileSize(blob.size)}</span>
              </div>
              {blob.is_binary ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
                  Binary file preview is not available in MVP.
                </div>
              ) : (
                <pre className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-200">
                  <code>{blob.content}</code>
                </pre>
              )}
            </div>
          ) : null}
        </section>
      )}

      {directoryPath === "" && readme && (
        <section>
          <SectionHeader title="README" />
          <div className="px-4 py-4">
            {readme.is_binary ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
                README is binary and cannot be previewed.
              </div>
            ) : (
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200">
                {readme.content}
              </pre>
            )}
          </div>
        </section>
      )}

      <section>
        <SectionHeader
          title="Recent Commits"
          action={
            <Link
              href={`/spaces/${spaceId}/repos/${repoId}/commits`}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              View all →
            </Link>
          }
        />
        {commits.length === 0 ? (
          <EmptyState
            icon={<ClockIcon className="w-10 h-10" />}
            title="No commits yet"
            description="Commit history will appear here after the first push."
          />
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {commits.slice(0, 5).map((commit) => (
              <div key={commit.oid} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-sky-400">
                    {commit.short_oid}
                  </span>
                  <p className="truncate text-sm text-white">{commit.message}</p>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <span>{commit.author_name}</span>
                  <span>·</span>
                  <span>{formatRelativeTime(commit.authored_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
