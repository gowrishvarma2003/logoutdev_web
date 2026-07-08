"use client";

import { use } from "react";
import Link from "next/link";
import { useProfileLaunches } from "@/lib/hooks/useProfile";
import LaunchCard from "@/components/launches/LaunchCard";
import { ProfileCardGridSkeleton } from "@/components/profile/ProfileSkeleton";
import { SparklesIcon } from "@/components/ui/Icons";
import EmptyState from "@/components/ui/EmptyState";

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
      <div className="p-5">
        <EmptyState
          icon={<SparklesIcon className="h-7 w-7" />}
          title="No launches yet"
          description="Turn a repo, prototype, or product idea into a launch page when it is ready for eyes."
          tone="feed"
          action={
            <Link href="/launches/new" className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">
              Create launch
            </Link>
          }
        />
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
