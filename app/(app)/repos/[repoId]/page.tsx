"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRepoContext } from "./layout";
import { useBranches, useRepositoryBlob, useRepositoryCommits, useRepositoryReadme, useRepositoryTree, useTags } from "@/lib/hooks/useRepos";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { formatFileSize, formatRelativeTime } from "@/lib/utils";
import { FolderIcon, DocumentIcon, ClockIcon } from "@heroicons/react/24/outline";

export default function RepoCodePage() {
  const { repo } = useRepoContext();
  const searchParams = useSearchParams();
  const currentPath = searchParams.get("path") || "";
  const currentView = searchParams.get("view") || "tree";
  const gitRemoteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = (API_BASE_URL || window.location.origin).replace(/\/$/, "");

    if (repo.owner?.username && repo.slug) {
      return `${origin}/git/${encodeURIComponent(repo.owner.username)}/${encodeURIComponent(repo.slug)}.git`;
    }

    return `${origin}/git/repos/${encodeURIComponent(repo.id)}.git`;
  }, [repo.id, repo.owner?.username, repo.slug]);
  const defaultBranch = repo.default_branch || "main";
  const pushCommands = useMemo(
    () =>
      [
        "git init",
        "git add .",
        'git commit -m "Initial commit"',
        `git branch -M ${defaultBranch}`,
        `git remote add origin ${gitRemoteUrl}`,
        `git push -u origin ${defaultBranch}`,
      ].join("\n"),
    [defaultBranch, gitRemoteUrl]
  );

  const directoryPath = currentView === "blob" ? currentPath.split("/").slice(0, -1).join("/") : currentPath;
  const activeRef = searchParams.get("ref") || defaultBranch;

  const { entries, loading: treeLoading } = useRepositoryTree(repo.id, activeRef, directoryPath);
  const { blob, loading: blobLoading } = useRepositoryBlob(
    repo.id,
    activeRef,
    currentView === "blob" ? currentPath : undefined
  );
  const { branches } = useBranches(repo.id);
  const { tags } = useTags(repo.id);
  const { readme } = useRepositoryReadme(repo.id, activeRef);
  const { commits } = useRepositoryCommits(repo.id, activeRef, undefined, 1);

  const breadcrumb = useMemo(() => {
    const parts = directoryPath ? directoryPath.split("/") : [];
    return parts.map((part, index) => ({
      name: part,
      path: parts.slice(0, index + 1).join("/"),
    }));
  }, [directoryPath]);

  const latestCommit = commits?.[0];

  return (
    <div className="space-y-6">
      {/* Branch selector & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current text-zinc-400">
              <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Z"></path>
            </svg>
            <span className="max-w-[150px] truncate">{activeRef}</span>
            <span className="text-zinc-500">▼</span>
          </button>
          
          <div className="flex items-center gap-3 text-sm text-zinc-400 ml-2 border-l border-zinc-800 pl-4 hidden sm:flex">
            <Link href={`/repos/${repo.id}/branches`} className="hover:text-blue-400 font-semibold flex items-center gap-1">
              <span className="text-zinc-200">{branches.length}</span> Branches
            </Link>
            <span className="font-semibold flex items-center gap-1 text-zinc-400">
              <span className="text-zinc-200">{tags.length}</span> Tags
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentView === "tree" && (
            <>
              <Link
                href={`/repos/${repo.id}/new?ref=${encodeURIComponent(activeRef)}&path=${encodeURIComponent(directoryPath)}`}
                className="hidden sm:block rounded-md px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              >
                Add file
              </Link>
              <button className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                Code ▼
              </button>
            </>
          )}
        </div>
      </div>

      {treeLoading && !entries.length && currentView !== "blob" ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : entries.length === 0 && currentView !== "blob" ? (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          <EmptyState
            icon={<CodeBracketIcon className="h-10 w-10" />}
            title="Empty repository"
            description="Push your first commit to start browsing files, commits, and branches here."
          />
          <div className="border-t border-zinc-800 bg-zinc-900/40 px-4 py-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-white">Push code from your local project</h4>
                <p className="mt-1 text-xs text-zinc-500">
                  Remote URL: <span className="font-mono text-zinc-300">{gitRemoteUrl}</span>
                </p>
              </div>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200">
              <code>{pushCommands}</code>
            </pre>
            {repo.visibility === "private" ? (
              <p className="mt-3 text-xs text-zinc-500">
                Use your LogoutDev username when Git asks for a username, and use an access token from{" "}
                <Link href="/settings/tokens" className="text-blue-400 hover:text-blue-300 hover:underline">
                  Settings → Tokens
                </Link>
                {" "}as the password.
              </p>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">
                Public repositories can be cloned without a token, but pushing still requires your username and an access token.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* File Browser / Code View */}
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
            {currentView === "tree" ? (
              <>
                {/* Latest commit header */}
                {latestCommit && (
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-6 w-6 shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                        {latestCommit.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                        <Link href={`/repos/${repo.id}/commits?author=${latestCommit.author_name}`} className="font-medium text-zinc-200 hover:text-blue-500 hover:underline truncate text-sm">
                          {latestCommit.author_name}
                        </Link>
                        <Link href={`/repos/${repo.id}/commits/${latestCommit.oid}`} className="text-zinc-400 hover:text-blue-500 hover:underline truncate text-sm">
                          {latestCommit.message}
                        </Link>
                      </div>
                    </div>
                    <div className="hidden sm:flex shrink-0 items-center gap-4 text-xs text-zinc-500">
                      <Link href={`/repos/${repo.id}/commits/${latestCommit.oid}`} className="font-mono hover:text-blue-400">
                        {latestCommit.short_oid}
                      </Link>
                      <span>{formatRelativeTime(latestCommit.authored_at)}</span>
                      <Link href={`/repos/${repo.id}/commits`} className="flex items-center gap-1 font-semibold text-zinc-300 hover:text-blue-400">
                        <ClockIcon className="h-4 w-4" />
                        <span className="hidden md:inline">History</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* File List */}
                <div className="divide-y divide-zinc-800/50">
                  {breadcrumb.length > 0 && (
                    <Link
                      href={`/repos/${repo.id}?ref=${encodeURIComponent(activeRef)}&path=${encodeURIComponent(
                        breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2].path : ""
                      )}`}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-900/50"
                    >
                      <div className="w-5 text-zinc-500">..</div>
                      <span className="text-sm text-zinc-300"></span>
                    </Link>
                  )}
                  {entries.map((entry) => {
                    const isTree = entry.type === "tree";
                    const href = `/repos/${repo.id}?ref=${encodeURIComponent(activeRef)}&path=${encodeURIComponent(entry.path)}${isTree ? "" : "&view=blob"}`;
                    return (
                      <Link
                        key={entry.path}
                        href={href}
                        className="group flex items-center justify-between gap-4 px-4 py-2.5 transition-colors hover:bg-zinc-900/50"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {isTree ? (
                            <FolderIcon className="h-5 w-5 text-zinc-400" />
                          ) : (
                            <DocumentIcon className="h-5 w-5 text-zinc-500" />
                          )}
                          <span className={`${isTree ? "text-zinc-200" : "text-zinc-300"} truncate text-sm group-hover:text-blue-400`}>
                            {entry.name}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            ) : (
              // Blob View
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className="font-mono font-medium text-zinc-300">{currentPath.split("/").pop()}</span>
                    <span className="w-px h-4 bg-zinc-700"></span>
                    <span>{blob ? formatFileSize(blob.size) : "..."}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Link
                      href={`/repos/${repo.id}/edit?ref=${encodeURIComponent(activeRef)}&path=${encodeURIComponent(currentPath)}`}
                      className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      title="Edit file"
                    >
                      <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current">
                        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.609Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.189 6.25 9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064l6.286-6.286Z"></path>
                      </svg>
                    </Link>
                  </div>
                </div>
                {blobLoading ? (
                  <div className="flex justify-center py-12"><Spinner /></div>
                ) : blob?.is_binary ? (
                  <div className="flex justify-center p-12 text-sm text-zinc-500">Binary file viewing is not supported.</div>
                ) : (
                  <pre className="overflow-x-auto p-4 text-sm font-mono text-zinc-300">
                    <code>{blob?.content}</code>
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* README Render */}
          {currentView === "tree" && directoryPath === "" && readme && !readme.is_binary && (
            <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
              <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm font-semibold text-white">
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current text-zinc-500">
                  <path d="M2 1.75A.75.75 0 0 1 2.75 1h10.5a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75H2.75a.75.75 0 0 1-.75-.75Zm1.5.75v11h9V2.5Z"></path>
                  <path d="M4.5 4.25a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75Z"></path>
                </svg>
                {"README.md"}
              </div>
              <article className="prose prose-invert max-w-none p-6 text-zinc-300">
                <pre className="font-sans whitespace-pre-wrap">{readme.content}</pre>
              </article>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CodeBracketIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className={`fill-current ${className}`}>
        <path d="m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L13.94 8l-3.72-3.72a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215Zm-6.56 0a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L2.06 8l3.72 3.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L.47 8.53a.75.75 0 0 1 0-1.06Z"></path>
    </svg>
  );
}
