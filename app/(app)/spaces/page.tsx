"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useSpaceList } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import type { ProjectSpace } from "@/lib/types";
import SpaceOverviewCard from "@/components/spaces/SpaceOverviewCard";
import Spinner from "@/components/ui/Spinner";
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
      <div className="rounded-lg border border-dashed border-zinc-800 px-4 py-16 text-center">
        <h3 className="text-base font-semibold text-white">No spaces matched</h3>
        <button type="button" onClick={onClear} className="mt-3 text-sm font-medium text-sky-300 hover:text-sky-200">
          Clear filters
        </button>
      </div>
    );
  }

  if (tab === "mine") {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 px-4 py-16 text-center">
        <FolderIcon className="mx-auto h-11 w-11 text-zinc-700" />
        <h3 className="mt-4 text-base font-semibold text-white">
          {signedIn ? "No spaces yet" : "Sign in to see your spaces"}
        </h3>
        {signedIn ? (
          <Link
            href="/spaces/create"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
          >
            <PlusIcon className="h-4 w-4" />
            Create Space
          </Link>
        ) : (
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
          >
            Sign in
          </Link>
        )}
      </div>
    );
  }

  if (tab === "working" || tab === "followed") {
    const isWorking = tab === "working";
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 px-4 py-16 text-center">
        {isWorking ? (
          <UsersIcon className="mx-auto h-11 w-11 text-zinc-700" />
        ) : (
          <BoltIcon className="mx-auto h-11 w-11 text-zinc-700" />
        )}
        <h3 className="mt-4 text-base font-semibold text-white">
          {signedIn
            ? isWorking
              ? "No working spaces yet"
              : "No followed spaces yet"
            : "Sign in to see this section"}
        </h3>
        {signedIn ? (
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            {isWorking
              ? "Spaces appear here when you join a project as a contributor or maintainer."
              : "Follow spaces you want to keep close and they will appear here."}
          </p>
        ) : (
          <Link
            href="/login"
            className="mt-5 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
          >
            Sign in
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-zinc-800 px-4 py-16 text-center">
      <SparklesIcon className="mx-auto h-10 w-10 text-zinc-700" />
      <h3 className="mt-4 text-base font-semibold text-white">
        {tab === "recommended" ? "No recommendations yet" : "No public spaces yet"}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        {tab === "recommended"
          ? "Recommended spaces will appear as public projects add contribution signals."
          : "Public spaces from the community will appear here."}
      </p>
    </div>
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
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-950 px-4 md:px-8">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-wrap items-center justify-between gap-3 py-5">
            <div>
              <div className="flex items-center gap-2">
                <RocketIcon className="h-5 w-5 text-white" />
                <h1 className="text-xl font-semibold text-white">Spaces</h1>
              </div>
              <p className="mt-1 text-sm text-zinc-500">Your project spaces, followed builds, and places to contribute.</p>
            </div>
            {user ? (
              <Link
                href="/spaces/create"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
              >
                <PlusIcon className="h-4 w-4" />
                New
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900"
              >
                Sign in
              </Link>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-3">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => switchTab(tab.key)}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors ${
                  visibleTab === tab.key
                    ? "bg-white text-zinc-950"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 pb-4 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                placeholder="Search stack or project theme"
                value={tag}
                onChange={(event) => {
                  setTag(event.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500"
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
              className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-sky-500 md:w-44"
            />

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-300 outline-none transition-colors focus:border-sky-500"
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

      <main className="mx-auto max-w-[1180px] px-4 py-5 md:px-8">
        <div className="mb-4 flex items-center justify-between gap-3 text-sm">
          <p className="text-zinc-500">
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
          <div className="grid gap-3">
            {spaces.map((space: ProjectSpace) => (
              <SpaceOverviewCard key={space.id} space={space} />
            ))}
          </div>
        ) : null}

        {page > 1 || spaces.length >= PAGE_LIMIT ? (
          <div className="mt-6 flex justify-center">
            <div className="inline-flex overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-zinc-800 disabled:text-zinc-600 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={spaces.length < PAGE_LIMIT}
                className="border-l border-zinc-800 px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-zinc-800 disabled:text-zinc-600 disabled:hover:bg-transparent"
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
