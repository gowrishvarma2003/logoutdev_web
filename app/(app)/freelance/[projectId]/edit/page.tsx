"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import FreelanceProjectForm from "@/components/freelance/FreelanceProjectForm";
import { useFreelanceProject } from "@/lib/hooks/useFreelance";
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

export default function FreelanceEditPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const { project, loading, error, refetch } = useFreelanceProject(projectId);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(payload: FreelanceProjectFormPayload) {
    setSaving(true);
    setSaveError(null);
    try {
      await freelanceApi.updateFreelanceProject(projectId, payload);
      await refetch();
      router.push(`/freelance/${projectId}`);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !project) {
    return <p className="p-4 text-sm text-rose-400">{error || "Project not found."}</p>;
  }

  if (!project.viewer_state?.is_owner) {
    return <p className="p-4 text-sm text-zinc-400">Only the client who posted this project can edit it.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <Link
        href={`/freelance/${projectId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Project
      </Link>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h1 className="text-2xl font-bold text-white">Edit freelance project</h1>
        <p className="mt-1 text-sm text-zinc-500">Adjust scope, pricing, or required skills before awarding.</p>

        <div className="mt-6">
          <FreelanceProjectForm
            initialProject={project}
            submitLabel="Save Changes"
            loading={saving}
            error={saveError}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
