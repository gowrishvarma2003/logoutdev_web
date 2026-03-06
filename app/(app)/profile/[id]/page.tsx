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

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function ProfileOverviewPage({ params }: ProfilePageProps) {
  const { id: username } = use(params);

  const { skills, featured_projects, is_me, loading: profileLoading } = useProfile(username);
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

      {/* ── Featured Projects ── */}
      <FeaturedProjectsPanel projects={featured_projects} showEmpty={is_me} />

      {/* ── Tech Stack ── */}
      <SkillsPanel skills={skills} showEmpty={is_me} />
    </div>
  );
}

