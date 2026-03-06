"use client";

import { use, useState } from "react";
import { useContributors, useSpace } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { SectionHeader, EmptyState } from "@/components/spaces/SpaceBadges";
import { UsersIcon } from "@/components/ui/Icons";
import * as api from "@/lib/services/spacesApi";
import type { MemberRole } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const ROLE_STYLES: Record<MemberRole, { color: string; bg: string }> = {
  owner:       { color: "text-amber-400", bg: "bg-amber-500/10" },
  maintainer:  { color: "text-violet-400", bg: "bg-violet-500/10" },
  contributor: { color: "text-sky-400",    bg: "bg-sky-500/10" },
};

/**
 * /spaces/[spaceId]/contributors — List of team members with role management.
 */
export default function ContributorsPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const { user } = useAuth();
  const { space } = useSpace(spaceId);
  const { contributors, loading, error, refetch } = useContributors(spaceId);
  const isOwner = space?.owner_id === user?.id;

  const [updating, setUpdating] = useState<string | null>(null);

  async function handleRoleChange(userId: string, newRole: MemberRole) {
    setUpdating(userId);
    try {
      await api.updateContributorRole(spaceId, userId, newRole);
      refetch();
    } catch {
      // silently fail for now
    } finally {
      setUpdating(null);
    }
  }

  async function handleRemove(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this space?`)) return;
    setUpdating(userId);
    try {
      await api.removeContributor(spaceId, userId);
      refetch();
    } catch {
      // silently fail for now
    } finally {
      setUpdating(null);
    }
  }

  // Sort: owner first, then maintainers, then contributors
  const sorted = [...contributors].sort((a, b) => {
    const order: Record<string, number> = { owner: 0, maintainer: 1, contributor: 2 };
    return (order[a.role] ?? 3) - (order[b.role] ?? 3);
  });

  return (
    <div>
      <SectionHeader title="Contributors" count={contributors.length} />

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 rounded-full border-zinc-800 border-t-zinc-300 animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-400 text-center py-8">{error}</p>
      )}

      {!loading && !error && sorted.length === 0 && (
        <EmptyState
          icon={<UsersIcon className="w-10 h-10" />}
          title="No contributors yet"
        />
      )}

      {!loading && !error && sorted.length > 0 && (
        <div className="divide-y divide-zinc-800/50">
          {sorted.map((member) => {
            const roleStyle = ROLE_STYLES[member.role] ?? ROLE_STYLES.contributor;
            const isMe = member.user_id === user?.id;
            const canManage = isOwner && !isMe && member.role !== "owner";

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-900/30 transition-colors"
              >
                <Avatar user={member.user} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">
                      {member.user?.name ?? "Unknown"}
                    </p>
                    {isMe && (
                      <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${roleStyle.bg} ${roleStyle.color}`}
                    >
                      {member.role}
                    </span>
                    <span className="text-[11px] text-zinc-600">
                      Joined {formatRelativeTime(member.joined_at)}
                    </span>
                  </div>
                </div>

                {/* Owner controls */}
                {canManage && (
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(
                          member.user_id,
                          e.target.value as MemberRole
                        )
                      }
                      disabled={updating === member.user_id}
                      className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-white focus:outline-none focus:border-zinc-600 disabled:opacity-50"
                    >
                      <option value="contributor">Contributor</option>
                      <option value="maintainer">Maintainer</option>
                    </select>
                    <button
                      onClick={() =>
                        handleRemove(
                          member.user_id,
                          member.user?.name ?? "this member"
                        )
                      }
                      disabled={updating === member.user_id}
                      className="px-2 py-1 rounded-lg text-[11px] text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
