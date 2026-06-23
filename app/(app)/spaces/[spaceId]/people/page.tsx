"use client";

import { use, useState } from "react";
import { useContributors, useFollowers, useSpace } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { SectionHeader, EmptyState } from "@/components/spaces/SpaceBadges";
import { UsersIcon, BoltIcon } from "@/components/ui/Icons";
import * as api from "@/lib/services/spacesApi";
import * as cache from "@/lib/services/requestCache";
import type { MemberRole } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const ROLE_STYLES: Record<MemberRole, { color: string; bg: string }> = {
  owner: { color: "text-amber-400", bg: "bg-amber-500/10" },
  maintainer: { color: "text-violet-400", bg: "bg-violet-500/10" },
  contributor: { color: "text-sky-400", bg: "bg-sky-500/10" },
};

export default function PeoplePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const { user } = useAuth();
  const { space } = useSpace(spaceId);
  const { contributors, loading, error, refetch } = useContributors(spaceId);
  const { followers, loading: followersLoading, error: followersError } = useFollowers(spaceId);
  const isOwner = space?.owner_id === user?.id;
  const [updating, setUpdating] = useState<string | null>(null);

  async function handleRoleChange(userId: string, newRole: MemberRole) {
    setUpdating(userId);
    try {
      await api.updateContributorRole(spaceId, userId, newRole);
      cache.invalidateSpace(spaceId, "people");
      cache.invalidateSpace(spaceId, "overview");
      refetch();
    } finally {
      setUpdating(null);
    }
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this space?`)) return;
    setUpdating(userId);
    try {
      await api.removeContributor(spaceId, userId);
      cache.invalidateSpace(spaceId, "people");
      cache.invalidateSpace(spaceId, "overview");
      refetch();
    } finally {
      setUpdating(null);
    }
  }

  const sorted = [...contributors].sort((a, b) => {
    const order: Record<string, number> = { owner: 0, maintainer: 1, contributor: 2 };
    return (order[a.role] ?? 3) - (order[b.role] ?? 3);
  });

  return (
    <div className="divide-y divide-zinc-800">
      <section>
        <SectionHeader title="Contributors" count={contributors.length} />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-zinc-300" />
          </div>
        ) : null}

        {error ? <p className="py-8 text-center text-sm text-rose-400">{error}</p> : null}

        {!loading && !error && sorted.length === 0 ? (
          <EmptyState icon={<UsersIcon className="w-10 h-10" />} title="No contributors yet" />
        ) : null}

        {!loading && !error && sorted.length > 0 ? (
          <div className="divide-y divide-zinc-800/50">
            {sorted.map((member) => {
              const roleStyle = ROLE_STYLES[member.role] ?? ROLE_STYLES.contributor;
              const isMe = member.user_id === user?.id;
              const canManage = isOwner && !isMe && member.role !== "owner";

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-900/30"
                >
                  <Avatar user={member.user} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-white">{member.user?.name ?? "Unknown"}</p>
                      {isMe ? (
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">You</span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${roleStyle.bg} ${roleStyle.color}`}
                      >
                        {member.role}
                      </span>
                      <span className="text-[11px] text-zinc-600">Joined {formatRelativeTime(member.joined_at)}</span>
                    </div>
                  </div>

                  {canManage ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(event) => handleRoleChange(member.user_id, event.target.value as MemberRole)}
                        disabled={updating === member.user_id}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-white focus:border-zinc-600 focus:outline-none disabled:opacity-50"
                      >
                        <option value="contributor">Contributor</option>
                        <option value="maintainer">Maintainer</option>
                      </select>
                      <button
                        onClick={() => handleRemove(member.user_id, member.user?.name ?? "this member")}
                        disabled={updating === member.user_id}
                        className="rounded-lg px-2 py-1 text-[11px] text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      <section>
        <SectionHeader title="Followers" count={followers.length} />

        {followersLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-zinc-300" />
          </div>
        ) : null}

        {followersError ? <p className="py-8 text-center text-sm text-rose-400">{followersError}</p> : null}

        {!followersLoading && !followersError && followers.length === 0 ? (
          <EmptyState
            icon={<BoltIcon className="w-10 h-10" />}
            title="No followers yet"
            description="People following this project will appear here as the space starts building in public."
          />
        ) : null}

        {!followersLoading && !followersError && followers.length > 0 ? (
          <div className="grid gap-3 px-4 py-4 sm:grid-cols-2">
            {followers.map((follow) => (
              <div key={follow.id} className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
                <Avatar user={follow.user} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{follow.user?.name ?? "Unknown"}</p>
                  <p className="text-xs text-zinc-500">Following since {formatRelativeTime(follow.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
