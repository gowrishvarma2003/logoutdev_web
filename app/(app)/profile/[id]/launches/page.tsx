"use client";

import { use } from "react";
import { useProfileLaunches } from "@/lib/hooks/useProfile";
import Spinner from "@/components/ui/Spinner";
import LaunchCard from "@/components/launches/LaunchCard";

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
    <div className="grid gap-4 px-5 py-6 sm:grid-cols-2 xl:grid-cols-3">
      {launches.map((launch) => (
        <LaunchCard key={launch.id} launch={launch} />
      ))}
    </div>
  );
}
