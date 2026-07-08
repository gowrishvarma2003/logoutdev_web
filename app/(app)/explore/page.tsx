"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ExploreFilters from "@/components/explore/ExploreFilters";
import ExploreSection from "@/components/explore/ExploreSection";
import BuilderCard from "@/components/explore/BuilderCard";
import LaunchCard from "@/components/explore/LaunchCard";
import SpaceCard from "@/components/explore/SpaceCard";
import QuestionCard from "@/components/explore/QuestionCard";
import FreelanceCard from "@/components/explore/FreelanceCard";
import { SparklesIcon } from "@/components/ui/Icons";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDiscovery } from "@/lib/hooks/useDiscovery";
import type { DiscoveryEntity } from "@/lib/types";

function buildExploreHref(
  pathname: string,
  current: URLSearchParams,
  patch: Partial<{
    q: string;
    type: string;
    stack: string;
    collab: boolean;
    sort: string;
  }>
) {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(patch)) {
    if (typeof value === "boolean") {
      if (value) next.set(key, "true");
      else next.delete(key);
      continue;
    }

    if (value) next.set(key, value);
    else next.delete(key);
  }

  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function FeaturedCardWrapper({ entity }: { entity: DiscoveryEntity }) {
  // Render the appropriate card component with a premium spotlight badge
  let cardComponent = null;

  switch (entity.type) {
    case "builder":
      cardComponent = <BuilderCard item={entity} />;
      break;
    case "launch":
      cardComponent = <LaunchCard item={entity} />;
      break;
    case "space":
      cardComponent = <SpaceCard item={entity} />;
      break;
    case "question":
      cardComponent = <QuestionCard item={entity} />;
      break;
    case "freelance_project":
      cardComponent = <FreelanceCard item={entity} />;
      break;
    default:
      cardComponent = (
        <div className="rounded-2xl border border-border-default bg-surface/60 p-4">
          <h3 className="text-sm font-semibold text-text-primary">{entity.title}</h3>
          <p className="mt-1 text-xs text-text-muted">{entity.subtitle}</p>
        </div>
      );
  }

  return (
    <div className="relative pt-2.5">
      <div className="absolute -top-1.5 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-text-primary shadow-lg">
        <SparklesIcon className="h-3 w-3" />
        Spotlight
      </div>
      {cardComponent}
    </div>
  );
}

export default function ExplorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => ({
      q: searchParams.get("q") || undefined,
      type: searchParams.get("type") || undefined,
      stack: searchParams.get("stack") || undefined,
      tag: searchParams.get("tag") || undefined,
      status: searchParams.get("status") || undefined,
      collab: ["1", "true", "yes", "open", "looking"].includes(
        (searchParams.get("collab") || "").toLowerCase()
      ),
      sort: searchParams.get("sort") || "recommended",
    }),
    [searchParams]
  );

  const discovery = useDiscovery(filters, true);

  function updateFilters(
    patch: Partial<{
      q: string;
      type: string;
      stack: string;
      collab: boolean;
      sort: string;
    }>
  ) {
    router.replace(
      buildExploreHref(
        pathname,
        new URLSearchParams(searchParams.toString()),
        patch
      )
    );
  }

  const isBrowsingAll = !filters.type;

  return (
    <div className="min-h-screen">
      {/* Editorial Glowing Banner Header */}
      <header className="relative overflow-hidden border-b border-border-default/60 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 px-6 py-9">
        {/* Abstract Background Glows */}
        <div className="absolute right-[-10%] top-[-20%] h-[150px] w-[300px] rounded-full bg-sky-500/10 blur-[100px]" />
        <div className="absolute left-[30%] bottom-[-50%] h-[120px] w-[240px] rounded-full bg-indigo-500/10 blur-[80px]" />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h1 className="bg-gradient-to-r from-white via-zinc-200 to-sky-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              Explore LogoutDev
            </h1>
            <p className="mt-1 text-xs font-medium text-text-disabled max-w-md">
              Find collaborators, discover products, and build the future of software with the developer community.
            </p>
          </div>
          {!user ? (
            <Link
              href="/login"
              className="rounded-xl border border-border-strong bg-surface/30 px-3.5 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-hover"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </header>

      {/* Premium Filter Controls and sliding tabs */}
      <ExploreFilters
        q={filters.q || ""}
        type={filters.type || ""}
        stack={filters.stack || ""}
        collab={filters.collab}
        sort={filters.sort || "recommended"}
        onChange={updateFilters}
      />

      {/* Main Discover Feed */}
      {discovery.loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : discovery.error ? (
        <div className="px-4 py-20 text-center animate-chat-fade-in">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-3">
            !
          </div>
          <p className="text-xs font-semibold text-rose-400">{discovery.error}</p>
          <button
            onClick={() => discovery.refetch()}
            className="mt-4 text-xs font-bold text-sky-400 hover:text-sky-300 underline"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Spotlight Row (Only visible when browsing "All" tab and no text query is present) */}
          {isBrowsingAll && !filters.q && discovery.data && discovery.data.featured_entities.length > 0 ? (
            <section className="border-b border-border-default/60 px-4 py-6">
              <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                <SparklesIcon className="h-4 w-4 text-sky-400 animate-pulse" />
                Featured Right Now
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {discovery.data.featured_entities.map((entity) => (
                  <FeaturedCardWrapper
                    key={`featured:${entity.type}:${entity.id}`}
                    entity={entity}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* Section results */}
          <div className="divide-y divide-border-default/40">
            {discovery.data?.sections.map((section) => (
              <ExploreSection key={section.key} section={section} />
            ))}
          </div>

          {/* Fallback empty view across all results */}
          {(!discovery.data || discovery.data.sections.length === 0 || discovery.data.sections.every(s => s.items.length === 0)) ? (
            <div className="px-4 py-24 text-center animate-chat-fade-in">
              <p className="text-sm text-text-disabled">No matching search signals or resources found.</p>
              <button
                onClick={() => updateFilters({ q: "", stack: "", sort: "recommended", collab: false })}
                className="mt-3 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
              >
                Clear all active search queries
              </button>
            </div>
          ) : null}

          {/* Sidebar rail modules recommendations in mobile/tablet viewport */}
          {discovery.data && discovery.data.rail_modules.length > 0 ? (
            <section className="border-t border-border-default/60 px-4 py-6 xl:hidden">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-text-muted">
                More to explore
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {discovery.data.rail_modules.map((module) => (
                  <div
                    key={module.key}
                    className="rounded-2xl border border-border-default/60 bg-surface/10 p-5 backdrop-blur-sm"
                  >
                    <h3 className="text-sm font-semibold text-text-secondary">
                      {module.title}
                    </h3>
                    <p className="mt-1 text-[10px] leading-relaxed text-text-disabled">
                      {module.reason}
                    </p>
                    <div className="mt-4 flex flex-col gap-1.5">
                      {module.items.slice(0, 4).map((item) => (
                        <Link
                          key={`${module.key}:${item.href}`}
                          href={item.href}
                          className="group rounded-xl border border-transparent px-3 py-2 transition-colors hover:border-border-default hover:bg-surface-hover/30"
                        >
                          <p className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                            {item.label}
                          </p>
                          {item.meta ? (
                            <p className="text-[10px] text-text-disabled mt-0.5">{item.meta}</p>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
