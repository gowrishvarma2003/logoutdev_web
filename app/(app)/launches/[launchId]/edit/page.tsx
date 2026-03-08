"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LaunchForm from "@/components/launches/LaunchForm";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import { useLaunch } from "@/lib/hooks/useLaunches";
import * as launchesApi from "@/lib/services/launchesApi";

export default function EditLaunchPage({ params }: { params: Promise<{ launchId: string }> }) {
  const { launchId } = use(params);
  const router = useRouter();
  const { launch, loading, error, refetch } = useLaunch(launchId);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (error || !launch) {
    return <p className="p-4 text-sm text-rose-400">{error || "Launch not found."}</p>;
  }

  if (!launch.viewer_state?.is_owner) {
    return <p className="p-4 text-sm text-zinc-400">Only the builder can edit this launch.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <Link href={`/launches/${launchId}`} className="mb-4 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to launch
      </Link>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h1 className="text-2xl font-bold text-white">Edit launch</h1>
        <p className="mt-1 text-sm text-zinc-500">Refine positioning, screenshots, links, or collaborator settings.</p>

        <div className="mt-6">
          <LaunchForm
            initialLaunch={launch}
            submitLabel="Save changes"
            loading={saving}
            error={saveError}
            onSubmit={async (payload) => {
              setSaving(true);
              setSaveError(null);
              try {
                await launchesApi.updateLaunch(launchId, payload);
                await refetch();
                router.push(`/launches/${launchId}`);
              } catch (err: unknown) {
                setSaveError(err instanceof Error ? err.message : "Failed to update launch");
              } finally {
                setSaving(false);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}