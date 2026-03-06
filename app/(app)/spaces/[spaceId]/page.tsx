"use client";

import { use } from "react";
import { useSpace, useStack, useContributors, useHealth, useDecisions, useUpdates } from "@/lib/hooks/useSpaces";
import TechStackPanel from "@/components/spaces/TechStackPanel";
import CollaborationHealthBadge from "@/components/spaces/CollaborationHealthBadge";
import DecisionLedgerCard from "@/components/spaces/DecisionLedgerCard";
import ProgressUpdateCard from "@/components/spaces/ProgressUpdateCard";
import Avatar from "@/components/ui/Avatar";
import { LinkIcon, UsersIcon, ClockIcon, CheckCircleIcon } from "@/components/ui/Icons";
import { SectionHeader, EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

/**
 * /spaces/[spaceId] — Overview tab.
 * Shows description, health, stack, recent updates, decisions, and contributors at a glance.
 */
export default function SpaceOverviewPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const { space } = useSpace(spaceId);
  const { stack, loading: stackLoading } = useStack(spaceId);
  const { contributors } = useContributors(spaceId);
  const { health } = useHealth(spaceId);
  const { decisions } = useDecisions(spaceId);
  const { updates } = useUpdates(spaceId);

  if (!space) return null;

  return (
    <div className="divide-y divide-zinc-800">
      {/* ── Description + Repo ────────────────────────────────────────────── */}
      {(space.description || space.primary_repo_url) && (
        <section className="px-4 py-5">
          {space.description && (
            <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed mb-3">
              {space.description}
            </p>
          )}
          {space.primary_repo_url && (
            <a
              href={space.primary_repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              {space.primary_repo_url.replace(/^https?:\/\//, "")}
            </a>
          )}
        </section>
      )}

      {/* ── Collaboration Health ──────────────────────────────────────────── */}
      <section className="p-4">
        <CollaborationHealthBadge health={health} />
      </section>

      {/* ── Tech Stack ────────────────────────────────────────────────────── */}
      <section>
        <SectionHeader title="Tech Stack" count={stack.length} />
        {stackLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <TechStackPanel stack={stack} />
        )}
      </section>

      {/* ── Recent Updates (last 3) ───────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Recent Updates"
          count={updates.length}
          action={
            updates.length > 0 ? (
              <Link
                href={`/spaces/${spaceId}/updates`}
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                View all →
              </Link>
            ) : undefined
          }
        />
        {updates.length === 0 ? (
          <EmptyState
            icon={<ClockIcon className="w-10 h-10" />}
            title="No updates yet"
            description="Progress updates will appear here."
          />
        ) : (
          <div>
            {updates.slice(0, 3).map((u) => (
              <ProgressUpdateCard key={u.id} update={u} />
            ))}
          </div>
        )}
      </section>

      {/* ── Decision Ledger (last 5) ──────────────────────────────────────── */}
      {decisions.length > 0 && (
        <section>
          <SectionHeader title="Recent Decisions" count={decisions.length} />
          <div>
            {decisions.slice(0, 5).map((d) => (
              <DecisionLedgerCard key={d.id} decision={d} />
            ))}
          </div>
        </section>
      )}

      {/* ── Contributors snapshot ─────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Contributors"
          count={contributors.length}
          action={
            <Link
              href={`/spaces/${spaceId}/contributors`}
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              View all →
            </Link>
          }
        />
        {contributors.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-10 h-10" />}
            title="No contributors"
          />
        ) : (
          <div className="px-4 py-3 flex flex-wrap gap-3">
            {contributors.slice(0, 8).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800"
              >
                <Avatar user={c.user} size="xs" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {c.user?.name ?? "Unknown"}
                  </p>
                  <p className="text-[11px] text-zinc-500 capitalize">{c.role}</p>
                </div>
              </div>
            ))}
            {contributors.length > 8 && (
              <Link
                href={`/spaces/${spaceId}/contributors`}
                className="flex items-center px-3 py-2 rounded-xl bg-zinc-800 text-xs text-zinc-400 font-medium hover:bg-zinc-700 transition-colors"
              >
                +{contributors.length - 8} more
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── Footer meta ───────────────────────────────────────────────────── */}
      <section className="px-4 py-4 text-xs text-zinc-600">
        Created {formatRelativeTime(space.created_at)}
        {space.updated_at && space.updated_at !== space.created_at && (
          <> · Updated {formatRelativeTime(space.updated_at)}</>
        )}
      </section>
    </div>
  );
}
