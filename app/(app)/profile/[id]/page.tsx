"use client";

/**
 * Profile overview page — /profile/:id
 * Shows: Proof-of-Work hero, career timeline, featured projects, tech stack,
 * and connected surfaces.
 * The header / stats / tabs are rendered by the parent layout.tsx.
 */

import { use } from "react";
import Link from "next/link";
import { useProfile, useProfileSignals, useProfileHeatmap } from "@/lib/hooks/useProfile";
import ProofOfWorkScoreBadge from "@/components/profile/ProofOfWorkScoreBadge";
import ActivityHeatmap from "@/components/profile/ActivityHeatmap";
import FeaturedProjectsPanel from "@/components/profile/FeaturedProjectsPanel";
import SkillsPanel from "@/components/profile/SkillsPanel";
import RelatedEntitiesPanel from "@/components/connected/RelatedEntitiesPanel";
import { ProfileOverviewSkeleton } from "@/components/profile/ProfileSkeleton";
import {
  SparklesIcon,
  RocketIcon,
  BoltIcon,
  CodeBracketIcon,
  TrendingUpIcon,
  CalendarIcon,
} from "@/components/ui/Icons";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

function EmptyCTA({ isMe }: { isMe: boolean }) {
  if (!isMe) {
    return (
      <div className="px-5 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
          <SparklesIcon className="w-5 h-5 text-zinc-600" />
        </div>
        <p className="text-zinc-600 text-sm">
          This developer hasn&apos;t filled out their profile yet.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-12">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-3">
          <SparklesIcon className="w-5 h-5 text-violet-400" />
        </div>
        <h2 className="text-base font-semibold text-white">Build your profile</h2>
        <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
          A complete profile helps you get discovered, trusted, and matched with collaborators.
        </p>
        <div className="mt-5 grid sm:grid-cols-3 gap-2.5 text-left">
          <Link href="/settings/profile" className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 hover:border-zinc-700 transition-colors group">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <CodeBracketIcon className="w-4 h-4 text-violet-400" />
              Add your skills
            </div>
            <p className="text-xs text-zinc-600 mt-1">Pin your stack so others can find you.</p>
          </Link>
          <Link href="/settings/profile" className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 hover:border-zinc-700 transition-colors group">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <RocketIcon className="w-4 h-4 text-sky-400" />
              Feature a project
            </div>
            <p className="text-xs text-zinc-600 mt-1">Showcase up to 3 spaces you build in.</p>
          </Link>
          <Link href="/launches/new" className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 hover:border-zinc-700 transition-colors group">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <TrendingUpIcon className="w-4 h-4 text-emerald-400" />
              Ship a launch
            </div>
            <p className="text-xs text-zinc-600 mt-1">Grow your proof-of-work score.</p>
          </Link>
        </div>
        <Link
          href="/settings/profile"
          className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors"
        >
          Edit profile
        </Link>
      </div>
    </div>
  );
}

const TIMELINE_TYPE_CONFIG = {
  launch: {
    icon: <SparklesIcon className="w-3.5 h-3.5" />,
    color: "bg-amber-500/15 text-amber-300",
    border: "border-amber-500/30",
  },
  freelance_win: {
    icon: <BoltIcon className="w-3.5 h-3.5" />,
    color: "bg-emerald-500/15 text-emerald-300",
    border: "border-emerald-500/30",
  },
  freelance_client: {
    icon: <BoltIcon className="w-3.5 h-3.5" />,
    color: "bg-fuchsia-500/15 text-fuchsia-300",
    border: "border-fuchsia-500/30",
  },
} as const;

export default function ProfileOverviewPage({ params }: ProfilePageProps) {
  const { id: username } = use(params);

  const { skills, featured_projects, is_me, career_summary, related_entities, loading: profileLoading } = useProfile(username);
  const { signals, loading: signalsLoading } = useProfileSignals(username);
  const { heatmap, loading: heatmapLoading } = useProfileHeatmap(username);

  if (profileLoading || signalsLoading) {
    return <ProfileOverviewSkeleton />;
  }

  const hasContent =
    signals || skills.length > 0 || featured_projects.length > 0 || (career_summary && career_summary.timeline.length > 0);

  if (!hasContent) {
    return <EmptyCTA isMe={is_me} />;
  }

  return (
    <div className="px-5 py-6 space-y-7">
      {/* ── Proof-of-Work hero ── */}
      {signals ? (
        <section id="proof-of-work" className="space-y-3">
          <ProofOfWorkScoreBadge signals={signals} />
          {career_summary && career_summary.strongest_stacks.length > 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-2.5">
                Strongest stacks
              </p>
              <div className="flex flex-wrap gap-2">
                {career_summary.strongest_stacks.map((stack) => (
                  <span
                    key={stack}
                    className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-300"
                  >
                    {stack}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ── Activity heatmap ── */}
      <ActivityHeatmap heatmap={heatmap} loading={heatmapLoading} />

      {/* ── Career graph ── */}
      {career_summary && career_summary.timeline.length > 0 ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-white">Career graph</h2>
            {career_summary.open_to_collaborate ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Open to collaborate
              </span>
            ) : null}
          </div>

          <div className="mt-5 relative">
            {/* vertical rail */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-zinc-800" />
            <div className="space-y-4">
              {career_summary.timeline.map((item) => {
                const cfg = TIMELINE_TYPE_CONFIG[item.type as keyof typeof TIMELINE_TYPE_CONFIG] ?? TIMELINE_TYPE_CONFIG.launch;
                return (
                  <Link
                    key={`${item.type}:${item.title}:${item.created_at}`}
                    href={item.href || "#"}
                    className="flex gap-3 group relative"
                  >
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 border-zinc-950 ${cfg.color} ${cfg.border} shrink-0`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors line-clamp-2">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500 flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleDateString("en", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Featured Projects ── */}
      <FeaturedProjectsPanel projects={featured_projects} showEmpty={is_me} />

      {/* ── Tech Stack ── */}
      <SkillsPanel skills={skills} showEmpty={is_me} />

      {/* ── Connected surfaces ── */}
      {related_entities.length > 0 ? (
        <RelatedEntitiesPanel items={related_entities} title="Connected surfaces" />
      ) : null}
    </div>
  );
}
