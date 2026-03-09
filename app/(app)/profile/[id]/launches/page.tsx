"use client";

import { use } from "react";
import Link from "next/link";
import { useProfileLaunches } from "@/lib/hooks/useProfile";
import Spinner from "@/components/ui/Spinner";

export default function ProfileLaunchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { launches, loading, error } = useProfileLaunches(id);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <p className="px-5 py-10 text-sm text-rose-400">{error}</p>;
  }

  if (launches.length === 0) {
    return <p className="px-5 py-10 text-sm text-zinc-500">No launches yet.</p>;
  }

  return (
    <div className="space-y-4 px-5 py-6">
      {launches.map((launch) => (
        <Link
          key={launch.id}
          href={`/launches/${launch.id}`}
          className="block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:bg-zinc-900"
        >
          <p className="text-base font-semibold text-white">{launch.name}</p>
          <p className="mt-1 text-sm text-zinc-400">{launch.tagline}</p>
          <p className="mt-3 text-xs text-zinc-500">
            {launch.upvote_count} upvotes • {launch.review_count} reviews
          </p>
        </Link>
      ))}
    </div>
  );
}
