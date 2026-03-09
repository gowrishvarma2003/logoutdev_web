"use client";

/**
 * Profile overview page — /profile/:id
 * Shows: Proof-of-Work badge, featured projects, tech stack skills.
 * The header / stats / tabs are rendered by the parent layout.tsx.
 */

import { use } from "react";
import { useProfile, useProfileSignals } from "@/lib/hooks/useProfile";
import ProofOfWorkScoreBadge from "@/components/profile/ProofOfWorkScoreBadge";
import FeaturedProjectsPanel from "@/components/profile/FeaturedProjectsPanel";
import SkillsPanel from "@/components/profile/SkillsPanel";
import Spinner from "@/components/ui/Spinner";
import RelatedEntitiesPanel from "@/components/connected/RelatedEntitiesPanel";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function ProfileOverviewPage({ params }: ProfilePageProps) {
  const { id: username } = use(params);

  const { skills, featured_projects, is_me, career_summary, related_entities, loading: profileLoading } = useProfile(username);
  const { signals, loading: signalsLoading } = useProfileSignals(username);

  if (profileLoading || signalsLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const hasContent =
    signals || skills.length > 0 || featured_projects.length > 0;

  if (!hasContent) {
    return (
      <div className="px-5 py-16 text-center">
        <p className="text-zinc-600 text-sm">
          {is_me
            ? "Your profile is empty. Head to Settings → Profile to get started."
            : "This developer hasn't filled out their profile yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-6 space-y-7">
      {/* ── Proof-of-Work Score ── */}
      {signals && <ProofOfWorkScoreBadge signals={signals} />}

      {career_summary ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-white">Career graph</h2>
            {career_summary.open_to_collaborate ? (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                Open to collaborate
              </span>
            ) : null}
          </div>

          {career_summary.strongest_stacks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {career_summary.strongest_stacks.map((stack) => (
                <span
                  key={stack}
                  className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs text-sky-300"
                >
                  {stack}
                </span>
              ))}
            </div>
          ) : null}

          {career_summary.timeline.length > 0 ? (
            <div className="mt-5 space-y-3">
              {career_summary.timeline.map((item) => (
                <div
                  key={`${item.type}:${item.title}:${item.created_at}`}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3"
                >
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(item.created_at).toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ── Featured Projects ── */}
      <FeaturedProjectsPanel projects={featured_projects} showEmpty={is_me} />

      {/* ── Tech Stack ── */}
      <SkillsPanel skills={skills} showEmpty={is_me} />

      <RelatedEntitiesPanel items={related_entities} title="Best next surfaces" />
    </div>
  );
}

