"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LaunchForm from "@/components/launches/LaunchForm";
import { ArrowLeftIcon } from "@/components/ui/Icons";
import * as launchesApi from "@/lib/services/launchesApi";

export default function NewLaunchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            submitLabel="Launch product"
            loading={loading}
            error={error}
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