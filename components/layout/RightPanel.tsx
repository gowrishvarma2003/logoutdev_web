"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { getTrendingHashtags } from "@/lib/api";
import type { DiscoveryRailModule, HashtagSuggestion, NextStepItem, RelatedEntityRef, User } from "@/lib/types";
import { useDiscovery } from "@/lib/hooks/useDiscovery";
import { emailToHandle } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import NextStepsPanel from "@/components/connected/NextStepsPanel";
import RelatedEntitiesPanel from "@/components/connected/RelatedEntitiesPanel";
import * as launchesApi from "@/lib/services/launchesApi";
import * as spacesApi from "@/lib/services/spacesApi";
import * as questionsApi from "@/lib/services/questionsApi";
import * as freelanceApi from "@/lib/services/freelanceApi";
import * as profilesApi from "@/lib/services/profilesApi";

interface RightPanelProps {
  currentUser: User;
}

export default function RightPanel({ currentUser }: RightPanelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [trending, setTrending] = useState<HashtagSuggestion[]>([]);
  const [routeNextSteps, setRouteNextSteps] = useState<NextStepItem[]>([]);
  const [routeRelated, setRouteRelated] = useState<RelatedEntityRef[]>([]);
  const discovery = useDiscovery(
    {
      q: searchParams.get("q") || undefined,
      type: searchParams.get("type") || undefined,
      stack: searchParams.get("stack") || undefined,
      tag: searchParams.get("tag") || undefined,
      status: searchParams.get("status") || undefined,
      collab: ["1", "true", "yes", "open", "looking"].includes((searchParams.get("collab") || "").toLowerCase()),
      sort: searchParams.get("sort") || undefined,
    },
    pathname === "/explore"
  );

  useEffect(() => {
    let cancelled = false;

    getTrendingHashtags(6)
      .then((res) => {
        if (!cancelled) {
          setTrending(res.hashtags);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTrending([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRouteModules() {
      const segments = pathname.split("/").filter(Boolean);
      setRouteNextSteps([]);
      setRouteRelated([]);

      try {
        if (segments[0] === "launches" && segments[1] && segments[1] !== "new" && segments[1] !== "me") {
          const res = await launchesApi.getLaunch(segments[1]);
          if (!cancelled) {
            setRouteNextSteps(res.launch.next_steps || []);
            setRouteRelated(res.launch.related_entities || []);
          }
          return;
        }

        if (segments[0] === "spaces" && segments[1] && !["create"].includes(segments[1])) {
          const res = await spacesApi.getSpace(segments[1]);
          if (!cancelled) {
            setRouteNextSteps(res.space.next_steps || []);
            setRouteRelated(res.space.related_entities || []);
          }
          return;
        }

        if (segments[0] === "questions" && segments[1]) {
          const res = await questionsApi.getQuestion(segments[1]);
          if (!cancelled) {
            setRouteNextSteps(res.question.next_steps || []);
            setRouteRelated(res.question.related_entities || []);
          }
          return;
        }

        if (segments[0] === "freelance" && segments[1] && !["create", "my-projects", "my-proposals"].includes(segments[1])) {
          const res = await freelanceApi.getFreelanceProject(segments[1]);
          if (!cancelled) {
            setRouteNextSteps(res.project.next_steps || []);
            setRouteRelated(res.project.related_entities || []);
          }
          return;
        }

        if (segments[0] === "profile" && segments[1]) {
          const res = await profilesApi.getProfile(segments[1]);
          if (!cancelled) {
            setRouteRelated(res.related_entities || []);
          }
        }
      } catch {
        if (!cancelled) {
          setRouteNextSteps([]);
          setRouteRelated([]);
        }
      }
    }

    loadRouteModules();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const handle = currentUser.username || emailToHandle(currentUser.email);
  const railModules = pathname === "/explore" ? discovery.data?.rail_modules || [] : [];

  function renderDiscoveryModule(module: DiscoveryRailModule) {
    return (
      <section key={module.key}>
        <h2 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {module.title}
        </h2>
        <p className="mb-3 px-1 text-[11px] leading-relaxed text-zinc-600">{module.reason}</p>
        <ul className="flex flex-col gap-0.5">
          {module.items.map((item) => (
            <li key={`${module.key}:${item.href}`}>
              <Link
                href={item.href}
                className="group block rounded-xl px-3 py-2 transition-colors hover:bg-zinc-800/60"
              >
                <p className="text-sm font-medium text-zinc-200 group-hover:text-white">{item.label}</p>
                {item.meta ? <p className="text-xs text-zinc-500">{item.meta}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 pt-6">
      <section>
        {pathname === "/explore" && railModules.length > 0 ? (
          <div className="flex flex-col gap-6">
            {railModules.map((module) => renderDiscoveryModule(module))}
          </div>
        ) : routeNextSteps.length > 0 || routeRelated.length > 0 ? (
          <div className="flex flex-col gap-4">
            {routeNextSteps.length > 0 ? <NextStepsPanel items={routeNextSteps} title="Next move" /> : null}
            {routeRelated.length > 0 ? <RelatedEntitiesPanel items={routeRelated} title="Connected surfaces" /> : null}
          </div>
        ) : (
          <>
            <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Trending topics
            </h2>
            <ul className="flex flex-col gap-0.5">
              {trending.length === 0 ? (
                <li className="px-3 py-2 text-xs text-zinc-600">No hashtag activity yet.</li>
              ) : (
                trending.map(({ normalized_tag, tag, recent_post_count, usage_count }) => (
                  <li key={normalized_tag}>
                    <Link
                      href={`/hashtags/${normalized_tag}`}
                      className="group block rounded-xl px-3 py-2 text-left transition-colors hover:bg-zinc-800/60"
                    >
                      <p className="text-sm font-medium text-sky-400 group-hover:text-sky-300">
                        #{tag}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {recent_post_count || usage_count} posts
                      </p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </section>

      <p className="mt-auto px-1 text-[11px] text-zinc-600">
        &copy; {new Date().getFullYear()} LogoutDev
      </p>
    </div>
  );
}
