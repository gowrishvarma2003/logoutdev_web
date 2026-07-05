"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRepoContext } from "./layout";
import { useAuth } from "@/lib/hooks/useAuth";
import { useBranches, useRepositoryBlob, useRepositoryCommits, useRepositoryReadme, useRepositoryTree, useTags, useRepoInsights, useRepoReleases } from "@/lib/hooks/useRepos";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { formatFileSize, formatRelativeTime } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon, FolderIcon, DocumentIcon, ClockIcon, CodeBracketIcon, KeyIcon, BookOpenIcon, Cog6ToothIcon, StarIcon, EyeIcon, ArrowPathIcon, CubeIcon, ArrowsRightLeftIcon, TagIcon } from "@heroicons/react/24/outline";

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

export default function RepoCodePage() {
  const { repo } = useRepoContext();
  const { user } = useAuth();
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  const [copiedField, setCopiedField] = useState<"url" | "commands" | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const branchMenuRef = useRef<HTMLDivElement | null>(null);
  const codePanelRef = useRef<HTMLDivElement | null>(null);
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
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const aIsTree = a.type === "tree";
      const bIsTree = b.type === "tree";
      if (aIsTree && !bIsTree) return -1;
      if (!aIsTree && bIsTree) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [entries]);
  const { blob, loading: blobLoading } = useRepositoryBlob(
    repo.id,
    activeRef,
    currentView === "blob" ? currentPath : undefined
  );
  const { branches } = useBranches(repo.id);
  const { tags } = useTags(repo.id);
  const { readme, loading: readmeLoading } = useRepositoryReadme(repo.id, activeRef);
  const { insights } = useRepoInsights(repo.id);
  const { releases } = useRepoReleases(repo.id);
  const { commits } = useRepositoryCommits(repo.id, activeRef, undefined, 1);

  const branchOptions = useMemo(() => {
    const uniqueBranches = new Map(branches.map((branch) => [branch.name, branch]));

    if (!uniqueBranches.has(activeRef)) {
      uniqueBranches.set(activeRef, {
        name: activeRef,
        oid: "",
        is_default: activeRef === defaultBranch,
        is_head: false,
      });
    }

    return [...uniqueBranches.values()].sort((a, b) => {
      if (a.name === activeRef) return -1;
      if (b.name === activeRef) return 1;
      if (a.name === defaultBranch) return -1;
      if (b.name === defaultBranch) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [activeRef, branches, defaultBranch]);

  const breadcrumb = useMemo(() => {
    const parts = directoryPath ? directoryPath.split("/") : [];
    return parts.map((part, index) => ({
      name: part,
      path: parts.slice(0, index + 1).join("/"),
    }));
  }, [directoryPath]);

  const latestCommit = commits?.[0];
  const isRepoOwner = Boolean(user?.id && repo.owner_id === user.id);

  useEffect(() => {
    if (!showBranchMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (branchMenuRef.current?.contains(event.target as Node)) return;
      setShowBranchMenu(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowBranchMenu(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showBranchMenu]);

  useEffect(() => {
    if (!showCodePanel) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (codePanelRef.current?.contains(event.target as Node)) return;
      const trigger = document.getElementById("code-button-trigger");
      if (trigger?.contains(event.target as Node)) return;
      setShowCodePanel(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCodePanel(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showCodePanel]);

  const handleDownloadZip = async () => {
    if (downloadingZip) return;
    setDownloadingZip(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_BASE_URL}/api/repos/${repo.id}/zip?ref=${encodeURIComponent(activeRef)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to download ZIP");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${repo.slug || "repository"}-${activeRef}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("ZIP download error:", error);
      alert("Failed to download repository ZIP archive.");
    } finally {
      setDownloadingZip(false);
    }
  };

  const branchHref = (branchName: string) => {
    const params = new URLSearchParams();
    params.set("ref", branchName);
    if (currentPath) params.set("path", currentPath);
    if (currentView !== "tree") params.set("view", currentView);
    return `/repos/${repo.id}?${params.toString()}`;
  };

  const handleCopy = async (value: string, field: "url" | "commands") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((current) => (current === field ? null : current));
      }, 1500);
    } catch {
      setCopiedField(null);
    }
  };

  return (
    <div className="space-y-6">
      {!repo.attached_space && isRepoOwner ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">Space Recommended</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Attach this repo to a Space to enable collaboration</h2>
          <p className="mt-1 text-sm text-amber-100/90">
            Spaces are where discussions, work planning, updates, and contributor coordination happen. This repo stays focused on code.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/repos/${repo.id}/settings`}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-50"
            >
              Attach to a Space
            </Link>
            <Link
              href="/spaces/create"
              className="rounded-lg border border-amber-300/30 px-4 py-2 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-400/10"
            >
              Create Space
            </Link>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 items-start">
        {/* Left Column: Code, Commits, Files, Readme */}
        <div className="space-y-6 lg:col-span-3 min-w-0">
          {/* Branch selector & Actions */}
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div ref={branchMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowBranchMenu((current) => !current)}
                  className="flex min-w-0 items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
                  aria-expanded={showBranchMenu}
                  aria-haspopup="menu"
                >
                  <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="shrink-0 fill-current text-zinc-400">
                    <path d="M11.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-2.25.75a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Z"></path>
                  </svg>
                  <span className="max-w-[150px] truncate">{activeRef}</span>
                  <ChevronDownIcon className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${showBranchMenu ? "rotate-180" : ""}`} />
                </button>

                {showBranchMenu ? (
                  <div
                    className="absolute left-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40"
                    role="menu"
                  >
                    <div className="border-b border-zinc-800 px-3 py-2">
                      <p className="text-xs font-semibold text-zinc-300">Switch branches</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto py-1">
                      {branchOptions.map((branch) => {
                        const isActive = branch.name === activeRef;
                        const isDefault = branch.name === defaultBranch;

                        return (
                          <Link
                            key={branch.name}
                            href={branchHref(branch.name)}
                            onClick={() => setShowBranchMenu(false)}
                            role="menuitem"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
                          >
                            <CheckIcon className={`h-4 w-4 shrink-0 ${isActive ? "text-blue-400" : "text-transparent"}`} />
                            <span className="min-w-0 flex-1 truncate">{branch.name}</span>
                            {isDefault ? (
                              <span className="shrink-0 rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                                Default
                              </span>
                            ) : null}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
              
              <div className="flex items-center gap-3 text-sm text-zinc-400 ml-2 border-l border-zinc-800 pl-4 hidden sm:flex">
                <span className="font-semibold flex items-center gap-1 text-zinc-400">
                  <span className="text-zinc-200">{branches.length}</span> Branches
                </span>
                <span className="font-semibold flex items-center gap-1 text-zinc-400">
                  <span className="text-zinc-200">{tags.length}</span> Tags
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentView === "tree" && (
                <>
                  {repo.can_push ? (
                    <Link
                      href={`/repos/${repo.id}/new?ref=${encodeURIComponent(activeRef)}&path=${encodeURIComponent(directoryPath)}`}
                      className="hidden sm:block rounded-md px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
                    >
                      Add file
                    </Link>
                  ) : (
                    <span className="hidden rounded-md border border-zinc-800 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500 sm:block">
                      Read only
                    </span>
                  )}
                  <button
                    type="button"
                    id="code-button-trigger"
                    onClick={() => setShowCodePanel((current) => !current)}
                    className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 shadow-sm transition-colors"
                  >
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="mr-1.5 fill-current">
                      <path d="m11.28 3.22 4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L13.94 8l-3.72-3.72a.75.75 0 0 1 1.06-1.06ZM4.72 3.22 0.47 7.47a.75.75 0 0 0 0 1.06l4.25 4.25a.75.75 0 1 0 1.06-1.06L2.06 8l3.72-3.72a.75.75 0 0 0-1.06-1.06Z"></path>
                    </svg>
                    Code
                    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="ml-1.5 fill-current opacity-80">
                      <path d="m4.427 7.427 3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"></path>
                    </svg>
                  </button>
                  {showCodePanel ? (
                    <div
                      ref={codePanelRef}
                      className="absolute right-0 top-full z-20 mt-2 w-80 sm:w-[360px] rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/40"
                    >
                      <div className="flex border-b border-zinc-800/80 mb-3 text-xs font-semibold text-zinc-400">
                        <div className="relative pb-2 px-1 text-zinc-100 font-medium">
                          Local
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-orange-500 rounded-full" />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-2 text-xs">
                          <code className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none font-mono text-zinc-300">
                            {gitRemoteUrl}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(gitRemoteUrl, "url")}
                            className="text-zinc-400 hover:text-zinc-200 active:text-white shrink-0"
                            title="Copy to clipboard"
                          >
                            {copiedField === "url" ? (
                              <CheckIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current">
                                <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path>
                                <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
                              </svg>
                            )}
                          </button>
                        </div>

                        <p className="text-[11px] text-zinc-500 leading-normal">
                          {repo.can_push
                            ? "Use this remote URL from your local Git repo."
                            : "You can clone this repo, but you need write access before you can push."}
                        </p>
                        <Link
                          href="/settings/tokens"
                          className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                        >
                          <KeyIcon className="h-3.5 w-3.5" />
                          Manage Git access tokens
                        </Link>
                      </div>

                      <div className="mt-4 border-t border-zinc-800/80 pt-3 space-y-1">
                        <a
                          href={`x-github-client://openRepo/${encodeURIComponent(gitRemoteUrl)}`}
                          className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-900/60 hover:text-white transition-colors"
                        >
                          <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current text-zinc-400">
                            <path d="M4 11.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1-.75-.75Z"></path>
                            <path d="M10.125 1.5a1.875 1.875 0 1 1 0 3.75h-4.25a1.875 1.875 0 0 1 0-3.75h4.25ZM5.875 3a.375 0 1 0 0 .75h4.25a.375 0 1 0 0-.75h-4.25ZM1.5 6.75C1.5 5.784 2.284 5 3.25 5h9.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.75 14H3.25A1.75 1.75 0 0 1 1.5 12.25v-5.5Zm1.75-.25a.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h9.5a.25 0 0 0 .25-.25v-5.5a.25 0 0 0-.25-.25H3.25Z"></path>
                          </svg>
                          <span>Open with GitHub Desktop</span>
                        </a>

                        <button
                          type="button"
                          onClick={handleDownloadZip}
                          disabled={downloadingZip}
                          className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-900/60 hover:text-white transition-colors text-left disabled:opacity-50"
                        >
                          <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current text-zinc-400">
                            <path d="M3.5 1.75a.25.25 0 0 1 .25-.25h3v2.25a.75.75 0 0 0 .75.75h2.25v2.75H3.75a.25.25 0 0 1-.25-.25V1.75Zm4.75 0v1.5h1.5a.25.25 0 0 0-.25-.25h-1.25ZM2 1.75C2 .784 2.784 0 3.75 0h4.5c.464 0 .91.184 1.237.513l3 3c.329.328.513.773.513 1.237v7.5A1.75 1.75 0 0 1 11.25 14h-7.5A1.75 1.75 0 0 1 2 12.25V1.75Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5H9.5a1.75 1.75 0 0 1-1.75-1.75V1.5H3.75Z"></path>
                          </svg>
                          <span>{downloadingZip ? "Downloading ZIP..." : "Download ZIP"}</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
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
                    <h4 className="text-sm font-semibold text-white">
                      {repo.can_push ? "Push code from your local project" : "Clone this repository"}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-500">
                      Remote URL: <span className="font-mono text-zinc-300">{gitRemoteUrl}</span>
                    </p>
                  </div>
                </div>
                {repo.can_push ? (
                  <pre className="mt-4 overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200">
                    <code>{pushCommands}</code>
                  </pre>
                ) : null}
                {repo.can_push && repo.visibility === "private" ? (
                  <p className="mt-3 text-xs text-zinc-500">
                    Use your LogoutDev username when Git asks for a username, and use an access token from{" "}
                    <Link href="/settings/tokens" className="text-blue-400 hover:text-blue-300 hover:underline">
                      Settings / Tokens
                    </Link>
                    {" "}as the password.
                  </p>
                ) : repo.can_push ? (
                  <p className="mt-3 text-xs text-zinc-500">
                    Public repositories can be cloned without a token, but pushing still requires your username and an access token.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-zinc-500">
                    You have read access here. Cloning is available, but creating commits or pushing from the web editor is limited to users with write access.
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
                      {sortedEntries.map((entry) => {
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
                        {repo.can_push ? (
                          <Link
                            href={`/repos/${repo.id}/edit?ref=${encodeURIComponent(activeRef)}&path=${encodeURIComponent(currentPath)}`}
                            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                            title="Edit file"
                          >
                            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current">
                              <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.609Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.189 6.25 9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064l6.286-6.286Z"></path>
                            </svg>
                          </Link>
                        ) : (
                          <span className="rounded-md border border-zinc-800 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                            Read only
                          </span>
                        )}
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
              {currentView === "tree" && directoryPath === "" && (
                <>
                  {readme && !readme.is_binary ? (
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
                  ) : !readmeLoading ? (
                    <div className="mt-6 flex flex-col items-center justify-center border border-zinc-800 rounded-xl bg-zinc-950 p-8 text-center">
                      <BookOpenIcon className="h-8 w-8 text-zinc-500 mb-3" />
                      <h3 className="text-base font-semibold text-white">Add a README</h3>
                      <p className="mt-1 text-sm text-zinc-500 max-w-sm">Help people interested in this repository understand your project.</p>
                      {repo.can_push ? (
                        <Link
                          href={`/repos/${repo.id}/new?ref=${encodeURIComponent(activeRef)}&path=README.md`}
                          className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                        >
                          Add a README
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-8 lg:col-span-1 border-t border-zinc-900 pt-6 lg:border-t-0 lg:pt-0">
          {/* About widget */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
              <h3 className="text-sm font-semibold text-white">About</h3>
              {repo.can_push && (
                <Link href={`/repos/${repo.id}/settings`} className="text-zinc-500 hover:text-zinc-300">
                  <Cog6ToothIcon className="h-4.5 w-4.5" />
                </Link>
              )}
            </div>
            {repo.description ? (
              <p className="text-sm leading-relaxed text-zinc-355">{repo.description}</p>
            ) : (
              <p className="text-sm italic text-zinc-500">No description, website, or topics provided.</p>
            )}

            <div className="space-y-3.5 text-sm text-zinc-400 pt-2">
              <Link href={`/repos/${repo.id}/commits`} className="flex items-center gap-2 hover:text-sky-400 transition-colors">
                <ArrowPathIcon className="h-4.5 w-4.5 text-zinc-500" />
                <span>Activity</span>
              </Link>
              <Link href={`/repos/${repo.id}/insights`} className="flex items-center gap-2 hover:text-sky-400 transition-colors">
                <StarIcon className="h-4.5 w-4.5 text-zinc-500" />
                <span>{repo.star_count || 0} stars</span>
              </Link>
              <Link href={`/repos/${repo.id}/insights`} className="flex items-center gap-2 hover:text-sky-400 transition-colors">
                <EyeIcon className="h-4.5 w-4.5 text-zinc-500" />
                <span>{repo.watcher_count || 0} watching</span>
              </Link>
              <Link href={`/repos/${repo.id}/forks`} className="flex items-center gap-2 hover:text-sky-400 transition-colors">
                <ArrowsRightLeftIcon className="h-4.5 w-4.5 text-zinc-500" />
                <span>{repo.fork_count || 0} forks</span>
              </Link>
            </div>
          </div>

          {/* Releases widget */}
          <div>
            <h3 className="border-b border-zinc-900 pb-2 mb-3 text-sm font-semibold text-white">Releases</h3>
            {releases && releases.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <TagIcon className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <Link href={`/repos/${repo.id}/releases`} className="text-sm font-medium text-sky-400 hover:text-sky-350 hover:underline truncate block">
                      {releases[0].title || releases[0].tag_name}
                    </Link>
                    <span className="text-xs text-zinc-500 block mt-0.5">
                      Latest • {formatRelativeTime(releases[0].created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-zinc-500 space-y-2">
                <p>No releases published</p>
                {repo.can_push && (
                  <Link href={`/repos/${repo.id}/releases`} className="inline-block text-xs font-semibold text-sky-400 hover:text-sky-350 hover:underline">
                    Create a new release
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Packages widget */}
          <div>
            <h3 className="border-b border-zinc-900 pb-2 mb-3 text-sm font-semibold text-white">Packages</h3>
            <div className="text-xs text-zinc-500 space-y-2">
              <p>No packages published</p>
              {repo.can_push && (
                <a href="#" className="inline-block text-xs font-semibold text-sky-400 hover:text-sky-350 hover:underline">
                  Publish your first package
                </a>
              )}
            </div>
          </div>

          {/* Contributors widget */}
          <div>
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2 mb-3">
              <h3 className="text-sm font-semibold text-white">Contributors</h3>
              {insights?.contributors && insights.contributors.length > 0 && (
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-400">
                  {insights.contributors.length}
                </span>
              )}
            </div>
            {insights?.contributors && insights.contributors.length > 0 ? (
              <div className="space-y-3">
                {insights.contributors.slice(0, 5).map((contributor) => (
                  <div key={`${contributor.author_email}-${contributor.author_name}`} className="flex items-center gap-2.5">
                    <div className="h-6 w-6 shrink-0 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                      {contributor.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-1.5">
                      <span className="text-xs font-semibold text-zinc-200 truncate">
                        {contributor.author_name}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate">
                        {contributor.commit_count} {contributor.commit_count === 1 ? "commit" : "commits"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No contributors detected yet.</p>
            )}
          </div>

          {/* Languages widget */}
          <div>
            <h3 className="border-b border-zinc-900 pb-2 mb-3 text-sm font-semibold text-white">Languages</h3>
            {repo.language ? (
              <div className="space-y-4">
                <div className="h-2 w-full rounded-full overflow-hidden flex bg-zinc-800">
                  {repo.languages && repo.languages.length > 0 ? (
                    repo.languages.map((lang) => (
                      <div
                        key={lang.name}
                        className="h-full first:rounded-l-full last:rounded-r-full"
                        style={{
                          width: `${lang.percentage}%`,
                          backgroundColor: LANGUAGE_COLORS[lang.name] || "#8b949e"
                        }}
                      />
                    ))
                  ) : (
                    <div
                      className="h-full w-full rounded-full"
                      style={{
                        backgroundColor: LANGUAGE_COLORS[repo.language] || "#8b949e"
                      }}
                    />
                  )}
                </div>
                
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
                  {repo.languages && repo.languages.length > 0 ? (
                    repo.languages.map((lang) => (
                      <span key={lang.name} className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: LANGUAGE_COLORS[lang.name] || "#8b949e" }}
                        />
                        <span className="text-zinc-200">{lang.name}</span>
                        <span className="text-zinc-500 font-normal">{lang.percentage.toFixed(1)}%</span>
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || "#8b949e" }}
                      />
                      <span className="text-zinc-200">{repo.language}</span>
                      <span className="text-zinc-500 font-normal">100.0%</span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No language data detected.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
