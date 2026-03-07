"use client";

import Link from "next/link";
import { useState } from "react";
import FreelanceFilters from "@/components/freelance/FreelanceFilters";
import FreelanceProjectCard from "@/components/freelance/FreelanceProjectCard";
import Spinner from "@/components/ui/Spinner";
import { useFreelanceProjects } from "@/lib/hooks/useFreelance";
import { useAuth } from "@/lib/hooks/useAuth";

export default function FreelancePage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const [pricingModel, setPricingModel] = useState("");
  const [engagementType, setEngagementType] = useState("");

  const freelance = useFreelanceProjects({
    q: q || undefined,
    skill: skill || undefined,
    pricing_model: pricingModel || undefined,
    engagement_type: engagementType || undefined,
    status: "open",
    sort: "newest",
    page: 1,
  });

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-[17px] font-bold text-white">Freelance</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Browse freelance projects, submit proposals, and move accepted work into private spaces.
        </p>
      </header>

      <FreelanceFilters
        q={q}
        onQChange={setQ}
        skill={skill}
        onSkillChange={setSkill}
        pricingModel={pricingModel}
        onPricingModelChange={setPricingModel}
        engagementType={engagementType}
        onEngagementTypeChange={setEngagementType}
      />

      {user && (
        <div className="flex flex-wrap gap-2 px-4 py-3">
          <Link href="/freelance/my-projects" className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800">
            My posted projects
          </Link>
          <Link href="/freelance/my-proposals" className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800">
            My proposals
          </Link>
        </div>
      )}

      <div className="space-y-3 p-4">
        {freelance.loading && (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        )}

        {freelance.error && (
          <p className="text-sm text-rose-400">{freelance.error}</p>
        )}

        {!freelance.loading && !freelance.error && freelance.projects.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
            <p className="text-sm text-zinc-400">No freelance projects match these filters yet.</p>
          </div>
        )}

        {freelance.projects.map((project) => (
          <FreelanceProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
