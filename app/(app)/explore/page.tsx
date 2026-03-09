"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ExploreFilters from "@/components/explore/ExploreFilters";
import ExploreSection from "@/components/explore/ExploreSection";
import { SparklesIcon } from "@/components/ui/Icons";
import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/lib/hooks/useAuth";
import { useDiscovery } from "@/lib/hooks/useDiscovery";

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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 px-4 py-4 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[17px] font-bold text-white">Explore</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              Search once and move across builders, launches, spaces, questions,
              and freelance work.
            </p>
          </div>
          {!user ? (
            <Link
              href="/login"
              className="rounded-xl border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              Sign in
            </Link>
          ) : null}
        </div>
      </header>

      <ExploreFilters
        q={filters.q || ""}
        type={filters.type || ""}
        stack={filters.stack || ""}
        collab={filters.collab}
        sort={filters.sort || "recommended"}
        onChange={updateFilters}
      />

      {discovery.loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : discovery.error ? (
        <div className="px-4 py-16 text-center">
          <p className="text-sm text-rose-400">{discovery.error}</p>
        </div>
      ) : (
        <>
          {discovery.data && discovery.data.featured_entities.length > 0 ? (
            <section className="border-b border-zinc-800 px-4 py-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <SparklesIcon className="h-4 w-4 text-sky-300" />
                Featured right now
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {discovery.data.featured_entities.map((entity) => (
                  <Link
                    key={`featured:${entity.type}:${entity.id}`}
                    href={entity.href}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {entity.meta.eyebrow}
                    </p>
                    <h2 className="mt-2 line-clamp-1 text-base font-semibold text-white">
                      {entity.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                      {entity.subtitle}
                    </p>
                    <p className="mt-4 text-xs text-sky-300">
                      {entity.rank_explanation.reasons[0] ||
                        entity.meta.collaboration_label ||
                        entity.meta.stats}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {discovery.data?.sections.map((section) => (
            <ExploreSection key={section.key} section={section} />
          ))}

          {discovery.data && discovery.data.rail_modules.length > 0 ? (
            <section className="border-t border-zinc-800 px-4 py-5 xl:hidden">
              <h2 className="mb-4 text-lg font-semibold text-white">
                More to explore
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {discovery.data.rail_modules.map((module) => (
                  <div
                    key={module.key}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
                  >
                    <h3 className="text-sm font-semibold text-white">
                      {module.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                      {module.reason}
                    </p>
                    <div className="mt-3 flex flex-col gap-2">
                      {module.items.slice(0, 4).map((item) => (
                        <Link
                          key={`${module.key}:${item.href}`}
                          href={item.href}
                          className="rounded-xl px-2 py-1.5 transition-colors hover:bg-zinc-800"
                        >
                          <p className="text-sm text-zinc-200">{item.label}</p>
                          {item.meta ? (
                            <p className="text-xs text-zinc-500">{item.meta}</p>
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
