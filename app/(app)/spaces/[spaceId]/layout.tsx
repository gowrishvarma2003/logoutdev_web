"use client";

import { use } from "react";
import { useSpace, useContributors } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import SpaceHeader from "@/components/spaces/SpaceHeader";
import Spinner from "@/components/ui/Spinner";

interface SpaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ spaceId: string }>;
}

/**
 * Layout for /spaces/[spaceId]/* routes.
 * Fetches space + contributors once and renders shared header with tabs.
 */
export default function SpaceLayout({ children, params }: SpaceLayoutProps) {
  const { spaceId } = use(params);
  const { space, loading, error } = useSpace(spaceId);
  const { contributors } = useContributors(spaceId);
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <h2 className="text-lg font-semibold text-white mb-2">Space not found</h2>
        <p className="text-sm text-zinc-500">{error || "This space doesn't exist or is private."}</p>
      </div>
    );
  }

  const isMember = contributors.some((c) => c.user_id === user?.id);
  const isOwner = space.owner_id === user?.id;

  return (
    <div className="min-h-screen">
      <SpaceHeader space={space} isMember={isMember || isOwner} isOwner={isOwner} />
      {children}
    </div>
  );
}
