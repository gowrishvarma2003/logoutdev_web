"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useSpaceList } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import type { ProjectSpace } from "@/lib/types";
import SpaceOverviewCard from "@/components/spaces/SpaceOverviewCard";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import {
  BoltIcon,
  FolderIcon,
  GlobeIcon,
  PlusIcon,
  RocketIcon,
  SearchIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/ui/Icons";

const PAGE_LIMIT = 20;

type SpaceTab = "mine" | "working" | "followed" | "recommended" | "public";

const TABS: Array<{ key: SpaceTab; label: string; icon: ReactNode }> = [
  { key: "mine", label: "My Spaces", icon: <FolderIcon className="h-4 w-4" /> },
  { key: "working", label: "Working", icon: <UsersIcon className="h-4 w-4" /> },
  { key: "followed", label: "Followed", icon: <BoltIcon className="h-4 w-4" /> },
  { key: "recommended", label: "Recommended", icon: <SparklesIcon className="h-4 w-4" /> },
  { key: "public", label: "All Public", icon: <GlobeIcon className="h-4 w-4" /> },
];

const STATUS_FILTERS = [
  { value: "", label: "Any status" },
  { value: "idea", label: "Idea" },
  { value: "building", label: "Building" },
  { value: "shipping", label: "Shipping" },
  { value: "paused", label: "Paused" },
];

const SIGNED_IN_TABS: SpaceTab[] = ["mine", "working", "followed"];

function EmptyTabState({
  tab,
  hasFilters,
  signedIn,
  onClear,
}: {
  tab: SpaceTab;
  hasFilters: boolean;
  signedIn: boolean;
  onClear: () => void;
}) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={<SearchIcon className="h-7 w-7" />}
        title="No spaces matched"
        description="Try a wider status, tag, or skill search to bring more projects into view."
        tone="space"
        action={
          <button type="button" onClick={onClear} className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">
            Clear filters
          </button>
        }
      />
    );
  }

  if (tab === "mine") {
    return (
      <EmptyState
        icon={<FolderIcon className="h-7 w-7" />}
        title={signedIn ? "Start your first space" : "Sign in to see your spaces"}
        description={signedIn ? "Create a space for an idea, repo, product, or collaboration you want to move forward." : "Your owned and joined spaces will appear here after you sign in."}
        tone="space"
        action={
          signedIn ? (
            <Link
              href="/spaces/create"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <PlusIcon className="h-4 w-4" />
              Create Space
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Sign in
            </Link>
          )
        }
      />
    );
  }

  if (tab === "working" || tab === "followed") {
    const isWorking = tab === "working";
    return (
      <EmptyState
        icon={isWorking ? <UsersIcon className="h-7 w-7" /> : <BoltIcon className="h-7 w-7" />}
        title={signedIn ? (isWorking ? "No working spaces yet" : "No followed spaces yet") : "Sign in to see this section"}
        description={isWorking ? "Spaces appear here when you join a project as a contributor or maintainer." : "Follow spaces you want to keep close and they will appear here."}
        tone="space"
        action={
          signedIn ? null : (
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Sign in
            </Link>
          )
        }
      />
    );
  }

  return (
    <EmptyState
      icon={<SparklesIcon className="h-7 w-7" />}
      title={tab === "recommended" ? "No recommendations yet" : "No public spaces yet"}
      description={tab === "recommended"
        ? "Recommended spaces will appear as public projects add contribution signals."
        : "Public spaces from the community will appear here."}
      tone="space"
    />
  );
}

export default function SpacesDiscoverPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SpaceTab>("mine");
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");
  const [neededSkill, setNeededSkill] = useState("");
  const [page, setPage] = useState(1);

  const visibleTab = !user && SIGNED_IN_TABS.includes(activeTab) ? "recommended" : activeTab;

  const queryFilters = {
    status: status || undefined,
    tag: tag || undefined,
    needed_skill: neededSkill || undefined,
    looking_for_contributors: visibleTab === "recommended" ? true : undefined,
    mine: visibleTab === "mine" || undefined,
    followed: visibleTab === "followed" || undefined,
    working: visibleTab === "working" || undefined,
    page,
    limit: PAGE_LIMIT,
  };

  const { data, loading, error } = useSpaceList(queryFilters);
  const total = data?.total ?? 0;
  const hasFilters = Boolean(status || tag.trim() || neededSkill.trim());

  const spaces = useMemo(() => {
    const listedSpaces = data?.spaces ?? [];
    if (visibleTab === "mine") {
      return listedSpaces.filter((space) => !user || space.owner_id === user.id);
    }
    return listedSpaces;
  }, [data?.spaces, user, visibleTab]);

  function switchTab(tab: SpaceTab) {
    setActiveTab(!user && SIGNED_IN_TABS.includes(tab) ? "recommended" : tab);
    setPage(1);
  }

  function clearFilters() {
    setStatus("");
    setTag("");
    setNeededSkill("");
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-app">
      <header className="border-b border-border-default bg-app px-4 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1080px]">
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <RocketIcon className="h-5 w-5 shrink-0 text-text-primary" />
                <h1 className="text-xl font-semibold text-text-primary">Spaces</h1>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-text-disabled">
                Your project spaces, followed builds, and places to contribute.
              </p>
            </div>
            {user ? (
              <Link
                href="/spaces/create"
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                <PlusIcon className="h-4 w-4" />
                New
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-9 shrink-0 items-center rounded-lg border border-border-strong px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface"
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
                  visibleTab === tab.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-text-muted hover:bg-surface-hover hover:text-text-primary"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 pb-4 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-disabled" />
              <input
                type="search"
                placeholder="Search stack or project theme"
                value={tag}
                onChange={(event) => {
                  setTag(event.target.value);
                  setPage(1);
                }}
                className="h-9 w-full rounded-lg border border-border-default bg-surface pl-9 pr-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled focus:border-sky-500"
              />
            </div>

            <input
              type="search"
              placeholder="Needed skill"
              value={neededSkill}
              onChange={(event) => {
                setNeededSkill(event.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-border-default bg-surface px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-disabled focus:border-sky-500 sm:w-40 lg:w-48"
            />

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-border-default bg-surface px-3 text-sm text-text-secondary outline-none transition-colors focus:border-sky-500 sm:w-36"
            >
              {STATUS_FILTERS.map((filter) => (
                <option key={filter.value || "all"} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 py-4 sm:px-5 lg:px-6">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm">
          <p className="text-text-disabled">
            {loading ? "Loading spaces..." : `${total || spaces.length} spaces`}
          </p>
          {hasFilters ? (
            <button type="button" onClick={clearFilters} className="font-medium text-sky-300 hover:text-sky-200">
              Clear filters
            </button>
          ) : null}
        </div>

        {loading && !spaces.length ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : null}

        {error ? <p className="py-12 text-center text-sm text-rose-400">{error}</p> : null}

        {!loading && !error && spaces.length === 0 ? (
          <EmptyTabState tab={visibleTab} hasFilters={hasFilters} signedIn={Boolean(user)} onClear={clearFilters} />
        ) : null}

        {!error && spaces.length > 0 ? (
          <div className={`grid gap-2.5 ${loading ? "opacity-60 pointer-events-none" : ""}`}>
            {loading && (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            )}
            {spaces.map((space: ProjectSpace) => (
              <SpaceOverviewCard key={space.id} space={space} />
            ))}
          </div>
        ) : null}

        {page > 1 || spaces.length >= PAGE_LIMIT ? (
          <div className="mt-6 flex justify-center">
            <div className="inline-flex overflow-hidden rounded-lg border border-border-default bg-surface">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-surface-hover disabled:text-text-disabled disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={spaces.length < PAGE_LIMIT || loading}
                className="border-l border-border-default px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-surface-hover disabled:text-text-disabled disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
