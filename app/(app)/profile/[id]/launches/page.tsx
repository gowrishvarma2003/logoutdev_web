"use client";

import { use } from "react";
import { useProfileLaunches } from "@/lib/hooks/useProfile";
import LaunchCard from "@/components/launches/LaunchCard";
import { ProfileCardGridSkeleton } from "@/components/profile/ProfileSkeleton";
import { SparklesIcon } from "@/components/ui/Icons";

export default function ProfileLaunchesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { launches, loading, error } = useProfileLaunches(id);

  if (loading) {
    return <ProfileCardGridSkeleton cards={3} />;
  }

  if (error) {
    return <p className="px-5 py-10 text-sm text-rose-400">{error}</p>;
  }

  if (launches.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3">
          <SparklesIcon className="w-5 h-5 text-zinc-600" />
        </div>
        <p className="text-zinc-600 text-sm">No launches yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 px-5 py-6 sm:grid-cols-2 xl:grid-cols-3">
      {launches.map((launch) => (
        <LaunchCard key={launch.id} launch={launch} />
      ))}
    </div>
  );
}
