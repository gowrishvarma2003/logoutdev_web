"use client";

import Link from "next/link";
import { useState } from "react";
import FreelanceFilters from "@/components/freelance/FreelanceFilters";
import FreelanceProjectCard from "@/components/freelance/FreelanceProjectCard";
import Spinner from "@/components/ui/Spinner";
import { useFreelanceProjects } from "@/lib/hooks/useFreelance";
import { useAuth } from "@/lib/hooks/useAuth";
import EmptyState from "@/components/ui/EmptyState";
import { BriefcaseIcon } from "@/components/ui/Icons";

export default function FreelancePage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [skill, setSkill] = useState("");
  const [pricingModel, setPricingModel] = useState("");
  const [engagementType, setEngagementType] = useState("");
  const [page, setPage] = useState(1);

  const freelance = useFreelanceProjects({
    q: q || undefined,
    skill: skill || undefined,
    pricing_model: pricingModel || undefined,
    engagement_type: engagementType || undefined,
    status: "open",
    sort: "newest",
    page,
  });

  const hasMore = freelance.projects.length >= 20;

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border-default bg-app/80 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[17px] font-bold text-text-primary">Freelance</h1>
            <p className="mt-0.5 text-sm text-text-disabled">
              Find and post freelance projects.
            </p>
          </div>
          {user && (
            <Link
              href="/freelance/create"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Post a project
            </Link>
          )}
        </div>
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
          <Link href="/freelance/my-projects" className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover">
            My posted projects
          </Link>
          <Link href="/freelance/my-proposals" className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-hover">
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
          <EmptyState
            icon={<BriefcaseIcon className="h-7 w-7" />}
            title="No projects match yet"
            description="Try a broader search, or post the kind of freelance project you want to see here."
            tone="project"
            action={
              user ? (
                <Link href="/freelance/create" className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">
                  Post a project
                </Link>
              ) : null
            }
          />
        )}

        {freelance.projects.map((project) => (
          <FreelanceProjectCard key={project.id} project={project} />
        ))}

        {!freelance.loading && !freelance.error && freelance.projects.length > 0 && (page > 1 || hasMore) && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-text-disabled">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
