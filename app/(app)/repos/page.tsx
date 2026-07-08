"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { StarIcon } from "@primer/octicons-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRepositoryList } from "@/lib/hooks/useRepos";
import * as reposApi from "@/lib/services/reposApi";
import * as cache from "@/lib/services/requestCache";
import Spinner from "@/components/ui/Spinner";
import {
  CodeBracketIcon,
  FolderIcon,
  GlobeIcon,
  LockIcon,
  SearchIcon,
  SparklesIcon,
  UsersIcon,
  ChevronDownIcon,
} from "@/components/ui/Icons";
import { formatRelativeTime } from "@/lib/utils";
import type { Repository } from "@/lib/types";
import CreateRepoModal from "./CreateRepoModal";

const PAGE_LIMIT = 20;

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

type RepoTab = "mine" | "shared" | "starred" | "recommended" | "public";
type RepoSort = "updated" | "newest" | "stars";
type StarOverride = { is_starred: boolean; star_count: number };

const TABS: Array<{ key: RepoTab; label: string; icon: ReactNode }> = [
  { key: "mine", label: "My Repos", icon: <FolderIcon className="h-4 w-4" /> },
  { key: "shared", label: "Shared", icon: <UsersIcon className="h-4 w-4" /> },
  { key: "starred", label: "Starred", icon: <StarIcon size={16} /> },
  { key: "recommended", label: "Recommended", icon: <SparklesIcon className="h-4 w-4" /> },
  { key: "public", label: "All Public", icon: <GlobeIcon className="h-4 w-4" /> },
];

function scoreLabel(score: number) {
  if (score >= 75) return "Strong match";
  if (score >= 50) return "Good match";
  return "Worth a look";
}

function repoOwnerName(repo: Repository) {
  return repo.owner?.username || repo.owner?.name || "unknown";
}

function VisibilityBadge({ visibility }: { visibility: Repository["visibility"] }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border-default px-2.5 py-0.5 text-[11px] font-semibold capitalize text-text-muted bg-surface/35">
      {visibility}
    </span>
  );
}

function RepoRecommendation({ repo }: { repo: Repository }) {
  if (!repo.recommendation) return null;

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
        <SparklesIcon className="h-3 w-3" />
        {scoreLabel(repo.recommendation.score)}
      </span>
      {repo.recommendation.reasons.slice(0, 3).map((reason) => (
        <span
          key={`${repo.id}:${reason}`}
          className="rounded-full bg-surface-hover px-2.5 py-0.5 text-[11px] font-medium text-text-secondary"
        >
          {reason}
        </span>
      ))}
    </div>
  );
}

function getSparklinePath(repoId: string): string {
  let hash = 0;
  for (let i = 0; i < repoId.length; i++) {
    hash = repoId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const points = [];
  const width = 120;
  const height = 18;
  const steps = 14;
  const stepWidth = width / (steps - 1);
  
  for (let i = 0; i < steps; i++) {
    const x = i * stepWidth;
    const randomVal = Math.abs(Math.sin(hash + i * 1.6));
    const bias = i / (steps - 1);
    const y = height - 1 - (randomVal * (height - 3) * (0.05 + bias * 0.95));
    points.push(`${x},${y}`);
  }
  
  return `M ${points.join(" L ")}`;
}

function RepoMeta({ repo }: { repo: Repository }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
      {repo.language ? (
        <span className="inline-flex items-center gap-1.5 text-text-secondary font-medium">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || "#8b949e" }}
          />
          {repo.language}
        </span>
      ) : null}

      {repo.star_count && repo.star_count > 0 ? (
        <span className="inline-flex items-center gap-1">
          <StarIcon size={14} className="text-text-muted" />
          <span>{repo.star_count}</span>
        </span>
      ) : null}

      {(repo.fork_count || 0) > 0 ? (
        <Link href={`/repos/${repo.id}/forks`} className="inline-flex items-center gap-1 hover:text-sky-300">
          <CodeBracketIcon className="h-3.5 w-3.5" />
          {repo.fork_count}
        </Link>
      ) : null}

      {repo.attached_space ? (
        <Link href={`/spaces/${repo.attached_space.id}`} className="truncate text-text-muted hover:text-sky-300">
          {repo.attached_space.name}
        </Link>
      ) : null}

      <span>Updated {formatRelativeTime(repo.updated_at)}</span>
    </div>
  );
}

function RepoCard({
  repo,
  isStarring,
  onToggleStar,
}: {
  repo: Repository;
  isStarring: boolean;
  onToggleStar: (repoId: string) => void;
}) {
  return (
    <article className="py-6 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/repos/${repo.id}`}
            className="break-words text-[20px] font-bold text-sky-400 hover:text-sky-300 hover:underline"
          >
            {repoOwnerName(repo)}/{repo.name}
          </Link>
          <VisibilityBadge visibility={repo.visibility} />
        </div>

        {repo.forked_from ? (
          <p className="mt-1 text-xs text-text-disabled">
            Forked from{" "}
            <Link href={`/repos/${repo.forked_from.id}`} className="hover:text-sky-300">
              {repo.forked_from.owner?.username}/{repo.forked_from.name}
            </Link>
          </p>
        ) : null}

        {repo.description ? (
          <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-relaxed text-text-muted">
            {repo.description}
          </p>
        ) : null}

        <RepoRecommendation repo={repo} />
        <RepoMeta repo={repo} />
      </div>

      <div className="flex flex-col items-end gap-5 self-stretch justify-between shrink-0">
        <div className="inline-flex rounded-lg border border-border-default bg-surface overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={() => onToggleStar(repo.id)}
            disabled={isStarring}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors disabled:opacity-50"
            aria-label={repo.is_starred ? "Unstar repository" : "Star repository"}
          >
            <StarIcon size={14} className={repo.is_starred ? "text-yellow-500 fill-yellow-500" : "text-text-muted"} />
            <span>{repo.is_starred ? "Starred" : "Star"}</span>
          </button>
          <div className="w-[1px] bg-surface-hover" />
          <button
            type="button"
            className="flex items-center px-2 hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <svg className="h-6 w-32 overflow-visible" viewBox="0 0 120 18">
          <path
            d={getSparklinePath(repo.id)}
            fill="none"
            stroke="#16a34a"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </article>
  );
}

function EmptyState({
  tab,
  hasFilters,
  onCreate,
  onClear,
  signedIn,
}: {
  tab: RepoTab;
  hasFilters: boolean;
  onCreate: () => void;
  onClear: () => void;
  signedIn: boolean;
}) {
  if (hasFilters) {
    return (
      <div className="rounded-lg border border-dashed border-border-default px-4 py-16 text-center">
        <h3 className="text-base font-semibold text-text-primary">No repositories matched</h3>
        <button type="button" onClick={onClear} className="mt-3 text-sm font-medium text-sky-300 hover:text-sky-200">
          Clear filters
        </button>
      </div>
    );
  }

  if (tab === "mine") {
    return (
      <div className="rounded-lg border border-dashed border-border-default px-4 py-16 text-center">
        <FolderIcon className="mx-auto h-11 w-11 text-zinc-700" />
        <h3 className="mt-4 text-base font-semibold text-text-primary">
          {signedIn ? "No repos yet" : "Sign in to see your repos"}
        </h3>
        {signedIn ? (
          <button
            type="button"
            onClick={onCreate}
            className="mt-5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-green-700"
          >
            Create repository
          </button>
        ) : (
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Sign in
          </Link>
        )}
      </div>
    );
  }

  if (tab === "shared" || tab === "starred") {
    const isShared = tab === "shared";
    return (
      <div className="rounded-lg border border-dashed border-border-default px-4 py-16 text-center">
        {isShared ? (
          <UsersIcon className="mx-auto h-11 w-11 text-zinc-700" />
        ) : (
          <StarIcon size={42} className="mx-auto text-zinc-700" />
        )}
        <h3 className="mt-4 text-base font-semibold text-text-primary">
          {signedIn
            ? isShared
              ? "No shared repos yet"
              : "No starred repos yet"
            : "Sign in to see this section"}
        </h3>
        {signedIn ? (
          <p className="mx-auto mt-2 max-w-md text-sm text-text-disabled">
            {isShared
              ? "Repos appear here after you accept a contributor invitation."
              : "Star repositories you want to keep close and they will appear here."}
          </p>
        ) : (
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Sign in
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border-default px-4 py-16 text-center">
      <SparklesIcon className="mx-auto h-10 w-10 text-zinc-700" />
      <h3 className="mt-4 text-base font-semibold text-text-primary">
        {tab === "recommended" ? "No recommendations yet" : "No public repositories yet"}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-text-disabled">
        {tab === "recommended"
          ? "Fresh public projects will appear here as builders publish repos and spaces."
          : "Public repos from the community will appear here."}
      </p>
    </div>
  );
}

export default function RepositoriesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<RepoTab>("mine");
  const [query, setQuery] = useState("");
  const [stack, setStack] = useState("");
  const [sort, setSort] = useState<RepoSort>("updated");
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [starringRepoId, setStarringRepoId] = useState<string | null>(null);
  const [starOverrides, setStarOverrides] = useState<Record<string, StarOverride>>({});

  const apiScope = activeTab === "public" ? "public" : activeTab;
  const hasFilters = Boolean(query.trim() || stack.trim() || (activeTab === "public" && sort !== "updated"));
  const { repos, loading, error, total, refetch } = useRepositoryList({
    scope: apiScope,
    q: query || undefined,
    stack: stack || undefined,
    sort: activeTab === "public" ? sort : "updated",
    page,
    limit: PAGE_LIMIT,
  });

  const displayRepos = useMemo(
    () =>
      repos.map((repo) => {
        const override = starOverrides[repo.id];
        return override
          ? { ...repo, is_starred: override.is_starred, star_count: override.star_count }
          : repo;
      }),
    [repos, starOverrides]
  );

  function switchTab(tab: RepoTab) {
    setActiveTab(tab);
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setStack("");
    setSort("updated");
    setPage(1);
  }

  async function handleToggleStar(repoId: string) {
    if (starringRepoId) return;
    setStarringRepoId(repoId);
    try {
      const result = await reposApi.toggleStar(repoId);
      setStarOverrides((current) => ({
        ...current,
        [repoId]: { is_starred: result.starred, star_count: result.star_count },
      }));
      // Keep cached listings + repo overview in sync so a tab switch back
      // doesn't show the pre-star counts.
      cache.invalidateRepo(repoId, "overview");
      cache.invalidateRepoListings();
    } catch {
      // Keep the repo list stable if the star request fails.
    } finally {
      setStarringRepoId(null);
    }
  }

  return (
    <div className="min-h-screen bg-app">
      <header className="border-b border-border-default bg-app px-4 md:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-wrap items-center justify-between gap-3 py-5">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">Repositories</h1>
              <p className="mt-1 text-sm text-text-disabled">Your code, contribution matches, and public projects.</p>
            </div>
            {user ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-green-700"
              >
                <FolderIcon className="h-4 w-4" />
                New
              </button>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-border-strong px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface"
              >
                Sign in
              </Link>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => switchTab(tab.key)}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-text-muted hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 pb-4 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <input
                type="search"
                placeholder="Find a repository..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-lg border border-border-default bg-surface pl-9 pr-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled focus:border-sky-500"
              />
            </div>

            <input
              type="search"
              placeholder="Stack or language"
              value={stack}
              onChange={(event) => {
                setStack(event.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-lg border border-border-default bg-surface px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled focus:border-sky-500 md:w-44"
            />

            {activeTab === "public" ? (
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as RepoSort);
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-border-default bg-surface px-3 text-sm text-text-secondary outline-none transition-colors focus:border-sky-500"
              >
                <option value="updated">Recently updated</option>
                <option value="stars">Most starred</option>
                <option value="newest">Newest</option>
              </select>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 py-5 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-3 text-sm">
          <p className="text-text-disabled">
            {loading ? "Loading repositories..." : `${total || displayRepos.length} repositories`}
          </p>
          {hasFilters ? (
            <button type="button" onClick={clearFilters} className="font-medium text-sky-300 hover:text-sky-200">
              Clear filters
            </button>
          ) : null}
        </div>

        {loading && !displayRepos.length ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : null}

        {error ? <p className="py-12 text-center text-sm text-rose-400">{error}</p> : null}

        {!loading && !error && displayRepos.length === 0 ? (
          <EmptyState
            tab={activeTab}
            hasFilters={hasFilters}
            onCreate={() => setIsCreateModalOpen(true)}
            onClear={clearFilters}
            signedIn={Boolean(user)}
          />
        ) : null}

        {!error && displayRepos.length > 0 ? (
          <div className="divide-y divide-border-default border-t border-border-default">
            {displayRepos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                isStarring={starringRepoId === repo.id}
                onToggleStar={handleToggleStar}
              />
            ))}
          </div>
        ) : null}

        {page > 1 || displayRepos.length >= PAGE_LIMIT ? (
          <div className="mt-6 flex justify-center">
            <div className="inline-flex overflow-hidden rounded-lg border border-border-default bg-surface">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-surface-hover disabled:text-text-disabled disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={displayRepos.length < PAGE_LIMIT}
                className="border-l border-border-default px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-surface-hover disabled:text-text-disabled disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </main>

      <CreateRepoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
          setPage(1);
          setActiveTab("mine");
          clearFilters();
        }}
      />
    </div>
  );
}
