"use client";

import { use } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  useSpace,
  useStack,
  useContributors,
  useHealth,
  useDecisions,
  useUpdates,
  useWork,
  useWorkSummary,
} from "@/lib/hooks/useSpaces";
import TechStackPanel from "@/components/spaces/TechStackPanel";
import CollaborationHealthBadge from "@/components/spaces/CollaborationHealthBadge";
import DecisionLedgerCard from "@/components/spaces/DecisionLedgerCard";
import ProgressUpdateCard from "@/components/spaces/ProgressUpdateCard";
import SpaceIssueCard from "@/components/spaces/SpaceIssueCard";
import Avatar from "@/components/ui/Avatar";
import {
  UsersIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  CodeBracketIcon,
  BoltIcon,
  ChatBubbleIcon,
  FolderIcon,
  ExternalLinkIcon,
} from "@/components/ui/Icons";
import { SectionHeader, EmptyState } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";
import NextStepsPanel from "@/components/connected/NextStepsPanel";
import RelatedEntitiesPanel from "@/components/connected/RelatedEntitiesPanel";
import TrustContextCard from "@/components/connected/TrustContextCard";

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
  const { issues } = useWork(spaceId, { page: 1, limit: 20, sort: "updated" });
  const { summary } = useWorkSummary(spaceId);

  if (!space) return null;

  const currentMembership = contributors.find((member) => member.user_id === user?.id) ?? null;
  const isOwnerOrMaintainer = space.owner_id === user?.id || currentMembership?.role === "maintainer";
  const attachments = space.attached_repos ?? [];
  const managedRepos = attachments.filter((attachment) => attachment.kind === "managed" && attachment.repo);
  const resources = attachments.filter((attachment) => attachment.kind === "external");
  const contributionResources = managedRepos.flatMap((attachment) =>
    (attachment.repo?.community_files ?? []).map((file) => ({
      key: `${attachment.repo?.id}:${file.key}`,
      repoId: attachment.repo?.id ?? "",
      label: `${attachment.repo?.name} · ${file.key}`,
      path: file.path,
    }))
  );
  const openWork = issues
    .filter((issue) => issue.status !== "resolved" && issue.status !== "closed")
    .slice(0, 4);
  const openWorkCount = summary?.open ?? openWork.length;
  const recentUpdates = updates.slice(0, 3);
  const activeRoles = space.open_roles ?? [];
  const neededSkills = space.needed_skills ?? [];

  return (
    <div className="divide-y divide-zinc-800">
      <section className="px-4 py-5">
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Mission</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-300">
              {space.description || "This space is still getting its public project brief written."}
            </p>

            {space.current_focus ? (
              <div className="mt-5 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-400">Current focus</p>
                <p className="mt-1 text-sm text-sky-100">{space.current_focus}</p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              {space.working_in_public ? (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  Working in public
                </span>
              ) : null}
              {activeRoles.map((role) => (
                <span key={role} className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-200">
                  Role: {role}
                </span>
              ))}
              {neededSkills.map((skill) => (
                <span key={skill} className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
                  {skill}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={user ? `/spaces/${spaceId}/join` : "/login"}
                className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
              >
                Start contributing
              </Link>
              <Link
                href={`/spaces/${spaceId}/work`}
                className="inline-flex items-center rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
              >
                Explore work
              </Link>
              {isOwnerOrMaintainer ? (
                <Link
                  href={space.linked_launch
                    ? `/launches/${space.linked_launch.id}/edit`
                    : `/launches/new?spaceId=${encodeURIComponent(spaceId)}&spaceName=${encodeURIComponent(space.name)}`}
                  className="inline-flex items-center rounded-xl border border-sky-500/30 px-4 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-500/10"
                >
                  {space.linked_launch ? "Edit launch" : "Create launch"}
                </Link>
              ) : null}
              {(space.contribution_guide || contributionResources.length > 0) ? (
                <a
                  href={`#contribute`}
                  className="inline-flex items-center rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                >
                  Contribution guide
                </a>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                <BoltIcon className="h-4 w-4 text-zinc-500" />
                Build In Public Snapshot
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">Followers</p>
                  <p className="mt-1 text-lg font-semibold text-white">{space.follower_count ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">Contributors</p>
                  <p className="mt-1 text-lg font-semibold text-white">{contributors.length}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">Attached repos</p>
                  <p className="mt-1 text-lg font-semibold text-white">{managedRepos.length}</p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">Open work</p>
                  <p className="mt-1 text-lg font-semibold text-white">{openWorkCount}</p>
                </div>
              </div>
              {summary ? (
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                    <p className="text-zinc-500">Blocked</p>
                    <p className="mt-0.5 font-semibold text-white">{summary.blocked}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                    <p className="text-zinc-500">Needs triage</p>
                    <p className="mt-0.5 font-semibold text-white">{summary.needs_triage}</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                    <p className="text-zinc-500">Ready</p>
                    <p className="mt-0.5 font-semibold text-white">{summary.ready_for_contributor}</p>
                  </div>
                </div>
              ) : null}
              {space.linked_launch ? (
                <Link
                  href={`/launches/${space.linked_launch.id}`}
                  className="mt-4 block rounded-2xl border border-sky-500/20 bg-sky-500/8 px-4 py-3 transition-colors hover:bg-sky-500/12"
                >
                  <p className="text-[11px] uppercase tracking-[0.16em] text-sky-300">Linked launch</p>
                  <p className="mt-1 text-sm font-semibold text-white">{space.linked_launch.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{space.linked_launch.tagline}</p>
                </Link>
              ) : null}
              {space.response_sla ? (
                <p className="mt-4 text-xs text-zinc-400">Expected response time: {space.response_sla}</p>
              ) : null}
            </div>

            <CollaborationHealthBadge health={health} />
          </div>
        </div>
      </section>

      {(space.trust_context || space.next_steps?.length || space.related_entities?.length) ? (
        <section className="p-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {space.trust_context ? <TrustContextCard trust={space.trust_context} /> : null}
            {space.next_steps ? <NextStepsPanel items={space.next_steps} /> : null}
          </div>
          {space.related_entities ? (
            <div className="mt-4">
              <RelatedEntitiesPanel items={space.related_entities} />
            </div>
          ) : null}
        </section>
      ) : null}

      {(managedRepos.length > 0 || resources.length > 0) && (
        <section>
          <SectionHeader
            title="Repos & Resources"
            count={attachments.length}
            action={
              <Link href={`/spaces/${spaceId}/repos`} className="text-xs text-sky-400 transition-colors hover:text-sky-300">
                Manage links →
              </Link>
            }
          />
          <div className="space-y-3 px-4 py-4">
            {managedRepos.length > 0 ? (
              <div className="grid gap-3">
                {managedRepos.slice(0, 3).map((attachment) => (
                  <Link
                    key={attachment.id}
                    href={`/repos/${attachment.repo?.id}`}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-colors hover:bg-zinc-900"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CodeBracketIcon className="h-4 w-4 text-zinc-500" />
                        <p className="truncate text-sm font-semibold text-white">{attachment.repo?.name}</p>
                        {attachment.is_primary ? (
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            Primary
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">
                        {attachment.repo?.description || `${attachment.repo?.visibility} repository`}
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">{attachment.repo?.my_role ?? "read"}</span>
                  </Link>
                ))}
              </div>
            ) : null}

            {resources.length > 0 ? (
              <div className="grid gap-3">
                {resources.slice(0, 3).map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.external_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 transition-colors hover:bg-zinc-900"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4 text-zinc-500" />
                        <p className="truncate text-sm font-semibold text-white">{attachment.label || attachment.external_url}</p>
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">{attachment.external_url}</p>
                    </div>
                    <ExternalLinkIcon className="h-4 w-4 text-zinc-500" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}

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
              <Link href={`/spaces/${spaceId}/updates`} className="text-xs text-sky-400 transition-colors hover:text-sky-300">
                View all →
              </Link>
            ) : undefined
          }
        />
        {recentUpdates.length === 0 ? (
          <EmptyState
            icon={<ClockIcon className="w-10 h-10" />}
            title="No updates yet"
            description="Progress updates will appear here."
          />
        ) : (
          <div>
            {recentUpdates.map((update) => (
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
          title="Open Work"
          count={openWorkCount}
          action={
            <Link href={`/spaces/${spaceId}/work`} className="text-xs text-sky-400 transition-colors hover:text-sky-300">
              View all →
            </Link>
          }
        />
        {openWork.length === 0 ? (
          <EmptyState
            icon={<QuestionMarkCircleIcon className="w-10 h-10" />}
            title="No open work"
            description="Tasks, bugs, docs, and research requests will appear here."
          />
        ) : (
          <div>
            {openWork.map((issue) => (
              <SpaceIssueCard key={issue.id} issue={issue} spaceId={spaceId} compact />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader
          title="People"
          count={contributors.length}
          action={
            <Link href={`/spaces/${spaceId}/people`} className="text-xs text-sky-400 transition-colors hover:text-sky-300">
              View all →
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
          </div>
        )}
      </section>

      {(space.contribution_guide || contributionResources.length > 0) ? (
        <section id="contribute" className="px-4 py-5">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="mb-3 flex items-center gap-2">
              <ChatBubbleIcon className="h-4 w-4 text-zinc-500" />
              <h2 className="text-sm font-semibold text-white">How To Contribute</h2>
            </div>
            {space.contribution_guide ? (
              <p className="whitespace-pre-line text-sm leading-7 text-zinc-300">{space.contribution_guide}</p>
            ) : (
              <p className="text-sm leading-7 text-zinc-400">
                Use the linked repo docs below for contribution expectations, then coordinate work and discussion in this Space.
              </p>
            )}
            {contributionResources.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {contributionResources.map((resource) => (
                  <Link
                    key={resource.key}
                    href={`/repos/${resource.repoId}?path=${encodeURIComponent(resource.path)}&view=blob`}
                    className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                  >
                    {resource.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {(space.recent_posts?.length ?? 0) > 0 ? (
        <section>
          <SectionHeader title="Member Posts" count={space.recent_posts?.length ?? 0} />
          <div className="space-y-3 px-4 py-3">
            {space.recent_posts?.slice(0, 3).map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition-colors hover:bg-zinc-800/60"
              >
                <p className="line-clamp-3 text-sm leading-6 text-zinc-300">{post.content}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="px-4 py-4 text-xs text-zinc-600">
        Created {formatRelativeTime(space.created_at)}
        {space.updated_at && space.updated_at !== space.created_at ? (
          <> · Updated {formatRelativeTime(space.updated_at)}</>
        ) : null}
        {isOwnerOrMaintainer ? (
          <>
            {" "}· <Link href={`/spaces/${spaceId}/manage`} className="text-zinc-500 transition-colors hover:text-zinc-300">Manage space</Link>
          </>
        ) : null}
      </section>
    </div>
  );
}
