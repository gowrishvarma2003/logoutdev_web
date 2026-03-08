"use client";

import { use } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSpace, useStack, useContributors, useHealth, useDecisions, useUpdates, useIssues } from "@/lib/hooks/useSpaces";
import { useRepos } from "@/lib/hooks/useRepos";
import TechStackPanel from "@/components/spaces/TechStackPanel";
import CollaborationHealthBadge from "@/components/spaces/CollaborationHealthBadge";
import DecisionLedgerCard from "@/components/spaces/DecisionLedgerCard";
import ProgressUpdateCard from "@/components/spaces/ProgressUpdateCard";
import SpaceIssueCard from "@/components/spaces/SpaceIssueCard";
import Avatar from "@/components/ui/Avatar";
import { LinkIcon, UsersIcon, ClockIcon, QuestionMarkCircleIcon } from "@/components/ui/Icons";
import { SectionHeader, EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";

export default function SpaceOverviewPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const { user } = useAuth();
  const { space } = useSpace(spaceId);
  const { stack, loading: stackLoading } = useStack(spaceId);
  const { contributors } = useContributors(spaceId);
  const { health } = useHealth(spaceId);
  const { decisions } = useDecisions(spaceId);
  const { updates } = useUpdates(spaceId);
  const { issues } = useIssues(spaceId, { page: 1, limit: 10 });
  const { repos } = useRepos(spaceId);

  if (!space) return null;

  const currentMembership = contributors.find((member) => member.user_id === user?.id) ?? null;
  const canSeeRepos = space.owner_id === user?.id || currentMembership?.role === "maintainer" || repos.length > 0;
  const openIssues = issues.filter((issue) => issue.status !== "resolved" && issue.status !== "closed").slice(0, 3);

  return (
    <div className="divide-y divide-zinc-800">
      {(space.description || space.primary_repo_url) && (
        <section className="px-4 py-5">
          {space.description && (
            <p className="mb-3 whitespace-pre-line text-sm leading-relaxed text-zinc-300">
              {space.description}
            </p>
          )}
          {space.primary_repo_url && (
            <a
              href={space.primary_repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-sky-400 transition-colors hover:text-sky-300"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              {space.primary_repo_url.replace(/^https?:\/\//, "")}
            </a>
          )}
        </section>
      )}

      <section className="p-4">
        <CollaborationHealthBadge health={health} />
      </section>

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

      <section>
        <SectionHeader
          title="Recent Updates"
          count={updates.length}
          action={
            updates.length > 0 ? (
              <Link
                href={`/spaces/${spaceId}/updates`}
                className="text-xs text-sky-400 transition-colors hover:text-sky-300"
              >
                View all â†’
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
            {updates.slice(0, 3).map((update) => (
              <ProgressUpdateCard key={update.id} update={update} />
            ))}
          </div>
        )}
      </section>

      {decisions.length > 0 && (
        <section>
          <SectionHeader title="Recent Decisions" count={decisions.length} />
          <div>
            {decisions.slice(0, 5).map((decision) => (
              <DecisionLedgerCard key={decision.id} decision={decision} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader
          title="Open Issues"
          count={openIssues.length}
          action={
            <Link
              href={`/spaces/${spaceId}/issues`}
              className="text-xs text-sky-400 transition-colors hover:text-sky-300"
            >
              View all â†’
            </Link>
          }
        />
        {openIssues.length === 0 ? (
          <EmptyState
            icon={<QuestionMarkCircleIcon className="w-10 h-10" />}
            title="No open issues"
            description="Problems, blockers, and bugs raised for this space will appear here."
          />
        ) : (
          <div>
            {openIssues.map((issue) => (
              <SpaceIssueCard key={issue.id} issue={issue} spaceId={spaceId} compact />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title="Contributors"
          count={contributors.length}
          action={
            <Link
              href={`/spaces/${spaceId}/contributors`}
              className="text-xs text-sky-400 transition-colors hover:text-sky-300"
            >
              View all â†’
            </Link>
          }
        />
        {contributors.length === 0 ? (
          <EmptyState icon={<UsersIcon className="w-10 h-10" />} title="No contributors" />
        ) : (
          <div className="flex flex-wrap gap-3 px-4 py-3">
            {contributors.slice(0, 8).map((contributor) => (
              <div
                key={contributor.id}
                className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2"
              >
                <Avatar user={contributor.user} size="xs" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    {contributor.user?.name ?? "Unknown"}
                  </p>
                  <p className="text-[11px] capitalize text-zinc-500">{contributor.role}</p>
                </div>
              </div>
            ))}
            {contributors.length > 8 && (
              <Link
                href={`/spaces/${spaceId}/contributors`}
                className="flex items-center rounded-xl bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-700"
              >
                +{contributors.length - 8} more
              </Link>
            )}
          </div>
        )}
      </section>

      {canSeeRepos && (
        <section>
          <SectionHeader
            title="Repositories"
            count={repos.length}
            action={
              <Link
                href={`/spaces/${spaceId}/repos`}
                className="text-xs text-sky-400 transition-colors hover:text-sky-300"
              >
                View all â†’
              </Link>
            }
          />
          {repos.length === 0 ? (
            <EmptyState
              icon={<LinkIcon className="w-10 h-10" />}
              title="No repo access yet"
              description="Private code repositories will appear here once you have access."
            />
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {repos.slice(0, 3).map((repo) => (
                <Link
                  key={repo.id}
                  href={`/spaces/${spaceId}/repos/${repo.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-zinc-900/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{repo.name}</p>
                    {repo.description && (
                      <p className="truncate text-xs text-zinc-500">{repo.description}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] uppercase text-sky-400">
                    {repo.my_role ?? "read"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="px-4 py-4 text-xs text-zinc-600">
        Created {formatRelativeTime(space.created_at)}
        {space.updated_at && space.updated_at !== space.created_at && (
          <> Â· Updated {formatRelativeTime(space.updated_at)}</>
        )}
      </section>
    </div>
  );
}
