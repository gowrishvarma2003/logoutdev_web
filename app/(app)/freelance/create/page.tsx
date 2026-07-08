"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FreelanceProjectForm from "@/components/freelance/FreelanceProjectForm";
import * as freelanceApi from "@/lib/services/freelanceApi";
import { ArrowLeftIcon } from "@/components/ui/Icons";

type FreelanceProjectFormPayload = {
  title: string;
  summary: string;
  description: string;
  pricing_model: "fixed" | "hourly";
  budget_min_cents: number;
  budget_max_cents: number;
  experience_level: string;
  engagement_type: string;
  duration_weeks: number | null;
  location_mode: string;
  timezone_note: string;
  skills: string[];
};

export default function FreelanceCreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(payload: FreelanceProjectFormPayload) {
    setLoading(true);
    setError(null);
    try {
      const { project } = await freelanceApi.createFreelanceProject(payload);
      router.push(`/freelance/${project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <Link
        href="/explore"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-text-disabled transition-colors hover:text-text-secondary"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Explore
      </Link>

      <div className="rounded-3xl border border-border-default bg-surface/50 p-6">
        <h1 className="text-2xl font-bold text-text-primary">Post a freelance project</h1>
        <p className="mt-1 text-sm text-text-disabled">
          Describe the work clearly and the platform will turn the winning proposal into a private workspace.
        </p>

        <div className="mt-6">
          <FreelanceProjectForm
            submitLabel="Publish Project"
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
