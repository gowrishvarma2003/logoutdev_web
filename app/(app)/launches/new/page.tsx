"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import LaunchForm from "@/components/launches/LaunchForm";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import * as launchesApi from "@/lib/services/launchesApi";

export default function NewLaunchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkedSpaceId = searchParams.get("spaceId") || "";
  const repoId = searchParams.get("repoId") || "";
  const repoName = searchParams.get("repoName") || "";
  const repoDescription = searchParams.get("repoDescription") || "";
  const spaceName = searchParams.get("spaceName") || "";

  const initialLaunch = useMemo(() => ({
    linked_space_id: linkedSpaceId || undefined,
    is_open_source: Boolean(repoId),
    linked_repos: repoId ? [{ id: "", repo_id: repoId, rank: 0 }] : undefined,
    name: repoName || "",
    tagline: repoDescription && repoDescription.length >= 20 ? repoDescription : "",
    launch_phase: "beta" as const,
  }), [linkedSpaceId, repoDescription, repoName, repoId]);

  const sourceHint = repoName
    ? `Starting from repo ${repoName}${spaceName ? ` in ${spaceName}` : ""}. The linked space is preselected for this launch.`
    : spaceName
      ? `Starting from space ${spaceName}. This launch will stay connected to that workspace.`
      : null;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <Link href="/launches" className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Launches
      </Link>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h1 className="text-2xl font-bold text-white">Create a launch</h1>
        <p className="mt-1 text-sm text-zinc-500">Ship a canonical launch page for your product and publish it immediately.</p>

        <div className="mt-6">
          <LaunchForm
            initialLaunch={initialLaunch}
            submitLabel="Launch product"
            publishOnSubmit
            loading={loading}
            error={error}
            sourceHint={sourceHint}
            onSubmit={async (payload) => {
              setLoading(true);
              setError(null);
              try {
                const result = await launchesApi.createLaunch({
                  ...payload,
                  status: "published",
                  publish_now: true,
                });
                router.push(`/launches/${result.launch.id}`);
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Failed to create launch");
              } finally {
                setLoading(false);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
