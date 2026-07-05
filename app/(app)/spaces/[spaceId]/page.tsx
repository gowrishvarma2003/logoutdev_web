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
  ChatBubbleIcon,
  FolderIcon,
  ExternalLinkIcon,
  BarChartIcon,
  SparklesIcon,
  HeartIcon,
  RocketIcon,
  CheckCircleIcon,
} from "@/components/ui/Icons";
import Spinner from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";

const LANGUAGE_COLORS: Record<string, string> = {
  "C#": "#178600",
  "C++": "#f34b7d",
  C: "#555555",
  CSS: "#563d7c",
  Dart: "#00B4AB",
  Dockerfile: "#384d54",
  Go: "#00ADD8",
  HTML: "#e34c26",
  Java: "#b07219",
  JavaScript: "#f1e05a",
  Kotlin: "#A97BFF",
  Makefile: "#427819",
  PHP: "#4F5D95",
  Python: "#3572A5",
  Ruby: "#701516",
  Rust: "#dea584",
  SCSS: "#c6538c",
  SQL: "#e38c00",
  Shell: "#89e051",
  Swift: "#F05138",
  TypeScript: "#3178c6",
  Vue: "#41b883",
};

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
  const { health, loading: healthLoading } = useHealth(spaceId);
  const { decisions, loading: decisionsLoading } = useDecisions(spaceId);
  const { updates, loading: updatesLoading } = useUpdates(spaceId);
  const { issues, loading: workLoading } = useWork(spaceId, { page: 1, limit: 20, sort: "updated" });
  const { summary, loading: summaryLoading } = useWorkSummary(spaceId);

  if (!space) return null;

  const currentMembership = contributors.find((member) => member.user_id === user?.id) ?? null;
  const isOwnerOrMaintainer = space.owner_id === user?.id || currentMembership?.role === "maintainer";
  const isOwner = space.owner_id === user?.id;
  const isMember = isOwner || !!currentMembership;

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
    <div className="max-w-4xl mx-auto px-4 py-5 sm:px-6 lg:px-8 space-y-4">

      {/* ── Mission & Focus ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4 transition-all duration-300 hover:border-zinc-700/80">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Mission</p>
          {space.working_in_public && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
              Working in public
            </span>
          )}
        </div>

        <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
          {space.description || "This space is still getting its public project brief written."}
        </p>

        {space.current_focus ? (
          <div className="mt-4 p-3 rounded-lg border border-sky-500/25 bg-gradient-to-r from-sky-950/15 to-indigo-950/15">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-400">
              <SparklesIcon className="w-3 h-3" />
              Current Focus
            </div>
            <p className="mt-1 text-sm text-sky-100 font-medium leading-relaxed">{space.current_focus}</p>
          </div>
        ) : null}

        {/* Role & Skill tags */}
        {(activeRoles.length > 0 || neededSkills.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-1.5 pt-3 border-t border-zinc-800/40">
            {activeRoles.map((role) => (
              <span key={role} className="rounded-full bg-zinc-800/80 border border-zinc-700/50 px-2.5 py-0.5 text-[11px] font-medium text-zinc-300">
                Role: {role}
              </span>
            ))}
            {neededSkills.map((skill) => (
              <span key={skill} className="rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-[11px] font-medium text-sky-400">
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2.5 pt-3 border-t border-zinc-800/40">
          {!isMember ? (
            <Link
              href={user ? `/spaces/${spaceId}/join` : "/login"}
              className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-all duration-200 hover:bg-zinc-100"
            >
              Start contributing
            </Link>
          ) : null}
          <Link
            href={`/spaces/${spaceId}/work`}
            className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-900/30 px-4 py-2 text-sm font-medium text-zinc-200 transition-all duration-200 hover:bg-zinc-800 hover:text-white"
          >
            Explore work
          </Link>
          {isOwnerOrMaintainer ? (
            <Link
              href={space.linked_launch
                ? `/launches/${space.linked_launch.id}/edit`
                : `/launches/new?spaceId=${encodeURIComponent(spaceId)}&spaceName=${encodeURIComponent(space.name)}`}
              className="inline-flex items-center rounded-lg border border-sky-500/25 bg-sky-950/20 px-4 py-2 text-sm font-medium text-sky-300 transition-all duration-200 hover:bg-sky-500/30 hover:text-sky-200"
            >
              {space.linked_launch ? "Edit launch" : "Create launch"}
            </Link>
          ) : null}
          {(space.contribution_guide || contributionResources.length > 0) ? (
            <a
              href={`#contribute`}
              className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-900/30 px-4 py-2 text-sm font-medium text-zinc-200 transition-all duration-200 hover:bg-zinc-800 hover:text-white"
            >
              Contribution guide
            </a>
          ) : null}
        </div>
      </div>

      {/* ══ Public Snapshot — full-width horizontal stats bar ══ */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4 transition-all duration-300 hover:border-zinc-700/80">
        <div className="flex items-center gap-2 mb-3">
          <BarChartIcon className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Public Snapshot</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-px rounded-lg bg-zinc-800/40 overflow-hidden">
          <div className="bg-zinc-950/50 py-3 text-center">
            <p className="text-lg font-extrabold text-white leading-none">{space.follower_count ?? 0}</p>
            <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold mt-1 flex items-center justify-center gap-1">
              <HeartIcon className="w-2.5 h-2.5 text-sky-400" />
              Followers
            </p>
          </div>
          <div className="bg-zinc-950/50 py-3 text-center">
            <p className="text-lg font-extrabold text-white leading-none">{contributors.length}</p>
            <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold mt-1 flex items-center justify-center gap-1">
              <UsersIcon className="w-2.5 h-2.5 text-emerald-400" />
              People
            </p>
          </div>
          <div className="bg-zinc-950/50 py-3 text-center">
            <p className="text-lg font-extrabold text-white leading-none">{managedRepos.length}</p>
            <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold mt-1 flex items-center justify-center gap-1">
              <CodeBracketIcon className="w-2.5 h-2.5 text-violet-400" />
              Repos
            </p>
          </div>
          <div className="bg-zinc-950/50 py-3 text-center">
            <p className="text-lg font-extrabold text-white leading-none">{openWorkCount}</p>
            <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold mt-1 flex items-center justify-center gap-1">
              <QuestionMarkCircleIcon className="w-2.5 h-2.5 text-amber-400" />
              Open Work
            </p>
          </div>
        </div>

        {/* Work Pipeline + Launch + SLA in a compact row below stats */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mt-4">
          {/* Pipeline */}
          {summaryLoading ? (
            <div className="flex-1 flex justify-center py-3">
              <Spinner />
            </div>
          ) : summary ? (() => {
            const total = (summary.blocked || 0) + (summary.needs_triage || 0) + (summary.ready_for_contributor || 0);
            const bPct = total > 0 ? ((summary.blocked || 0) / total) * 100 : 0;
            const tPct = total > 0 ? ((summary.needs_triage || 0) / total) * 100 : 0;
            const rPct = total > 0 ? ((summary.ready_for_contributor || 0) / total) * 100 : 0;
            return (
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Pipeline</p>
                <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-zinc-800/80">
                  {bPct > 0 && <div className="bg-rose-500 transition-all duration-700" style={{ width: `${bPct}%` }} />}
                  {tPct > 0 && <div className="bg-amber-500 transition-all duration-700" style={{ width: `${tPct}%` }} />}
                  {rPct > 0 && <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${rPct}%` }} />}
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-[9px]">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="text-zinc-500">Blocked</span>
                    <span className="font-bold text-rose-400">{summary.blocked}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-zinc-500">Triage</span>
                    <span className="font-bold text-amber-400">{summary.needs_triage}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-zinc-500">Ready</span>
                    <span className="font-bold text-emerald-400">{summary.ready_for_contributor}</span>
                  </span>
                </div>
              </div>
            );
          })() : null}

          {/* Launch banner */}
          {space.linked_launch ? (
            <Link
              href={`/launches/${space.linked_launch.id}`}
              className="flex items-center gap-2.5 rounded-lg border-l-2 border-sky-500/50 bg-zinc-950/40 px-3 py-2 transition-all duration-200 hover:bg-zinc-900/60 hover:border-sky-400 group/launch shrink-0"
            >
              <RocketIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-sky-400/80">Launch Active</p>
                <p className="text-xs font-bold text-white group-hover/launch:text-sky-300 transition-colors truncate">{space.linked_launch.name}</p>
              </div>
            </Link>
          ) : null}

          {/* Response SLA */}
          {space.response_sla ? (
            <div className="flex items-center gap-2 text-[11px] shrink-0">
              <span className="text-zinc-500 font-medium">Response Time:</span>
              <span className="font-semibold text-zinc-300">{space.response_sla}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* ══ Collaboration Health + Contributors — side by side ══ */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
        {/* Health */}
        {healthLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <CollaborationHealthBadge health={health} />
        )}

        {/* Contributors */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4 transition-all duration-300 hover:border-zinc-700/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Contributors</span>
            </div>
            <Link
              href={`/spaces/${spaceId}/people`}
              className="text-[10px] font-bold uppercase tracking-wider text-sky-400 transition-colors hover:text-sky-300"
            >
              View all →
            </Link>
          </div>
          {contributors.length === 0 ? (
            <p className="text-xs text-zinc-500 py-3 text-center">No contributors yet.</p>
          ) : (
            <div className="divide-y divide-zinc-800/40">
              {contributors.slice(0, 5).map((contributor) => (
                <div
                  key={contributor.id}
                  className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
                >
                  <Avatar user={contributor.user} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white leading-tight">
                      {contributor.user?.name ?? "Unknown"}
                    </p>
                    <p className="text-[10px] text-zinc-500 capitalize leading-none mt-0.5">{contributor.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {contributors.length > 5 && (
            <Link
              href={`/spaces/${spaceId}/people`}
              className="block mt-2 pt-2 border-t border-zinc-800/40 text-center text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              +{contributors.length - 5} more
            </Link>
          )}
        </div>
      </div>

      {/* ── Recent Updates ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4 transition-all duration-300 hover:border-zinc-700/80">
        <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent Updates</span>
          </div>
          {updates.length > 0 && (
            <Link
              href={`/spaces/${spaceId}/updates`}
              className="text-[10px] font-bold uppercase tracking-wider text-sky-400 transition-colors hover:text-sky-300"
            >
              View all →
            </Link>
          )}
        </div>
        {updatesLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : recentUpdates.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">No progress updates yet.</p>
        ) : (
          <div className="space-y-1">
            {recentUpdates.map((update) => (
              <ProgressUpdateCard key={update.id} update={update} />
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Decisions ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4 transition-all duration-300 hover:border-zinc-700/80">
        <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Recent Decisions</span>
          </div>
          {decisions.length > 0 && (
            <Link
              href={`/spaces/${spaceId}/discussions`}
              className="text-[10px] font-bold uppercase tracking-wider text-sky-400 transition-colors hover:text-sky-300"
            >
              View all →
            </Link>
          )}
        </div>
        {decisionsLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : decisions.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">No key decisions recorded.</p>
        ) : (
          <div className="divide-y divide-zinc-800/40">
            {decisions.slice(0, 4).map((decision) => (
              <DecisionLedgerCard key={decision.id} decision={decision} />
            ))}
          </div>
        )}
      </div>

      {/* ── Repos & Resources ── */}
      {(managedRepos.length > 0 || resources.length > 0) && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4">
          <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-zinc-800/50">
            <div className="flex items-center gap-2">
              <CodeBracketIcon className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Repos & Resources</span>
            </div>
            {isOwnerOrMaintainer && (
              <Link
                href={`/spaces/${spaceId}/repos`}
                className="text-[10px] font-bold uppercase tracking-wider text-sky-400 transition-colors hover:text-sky-300"
              >
                Manage →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {managedRepos.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Codebases</p>
                {managedRepos.slice(0, 3).map((attachment) => (
                  <Link
                    key={attachment.id}
                    href={`/repos/${attachment.repo?.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2.5 transition-all duration-200 hover:bg-zinc-900/60 hover:border-zinc-700"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <CodeBracketIcon className="h-3 w-3 text-zinc-500" />
                        <p className="truncate text-xs font-semibold text-white">{attachment.repo?.name}</p>
                        {attachment.is_primary ? (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-px text-[9px] font-bold text-emerald-400 uppercase">
                            Primary
                          </span>
                        ) : null}
                        {attachment.repo?.language ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400 ml-1">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: LANGUAGE_COLORS[attachment.repo.language] || "#8b949e" }}
                            />
                            {attachment.repo.language}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 shrink-0">
                      {attachment.repo?.my_role ?? "read"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            {resources.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Documents & Links</p>
                {resources.slice(0, 3).map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.external_url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-3 py-2.5 transition-all duration-200 hover:bg-zinc-900/60 hover:border-zinc-700"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-3 w-3 text-zinc-500" />
                        <p className="truncate text-xs font-semibold text-white">{attachment.label || attachment.external_url}</p>
                      </div>
                    </div>
                    <ExternalLinkIcon className="h-3 w-3 text-zinc-500 shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Open Work ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4">
        <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <QuestionMarkCircleIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Active Work Items</span>
          </div>
          <Link
            href={`/spaces/${spaceId}/work`}
            className="text-[10px] font-bold uppercase tracking-wider text-sky-400 transition-colors hover:text-sky-300"
          >
            View all →
          </Link>
        </div>
        {workLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : openWork.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">No active work items at the moment.</p>
        ) : (
          <div className="divide-y divide-zinc-800/40">
            {openWork.map((issue) => (
              <SpaceIssueCard key={issue.id} issue={issue} spaceId={spaceId} compact />
            ))}
          </div>
        )}
      </div>

      {/* ── Contribution Handbook ── */}
      {(space.contribution_guide || contributionResources.length > 0) ? (
        <div id="contribute" className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4 scroll-mt-6">
          <div className="mb-3 flex items-center gap-2 pb-1.5 border-b border-zinc-800/50">
            <ChatBubbleIcon className="h-3.5 w-3.5 text-zinc-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Contribution Handbook</h2>
          </div>
          {space.contribution_guide ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">{space.contribution_guide}</p>
          ) : (
            <p className="text-sm leading-relaxed text-zinc-400">
              Use the linked repo docs below for contribution expectations, then coordinate work and discussion in this Space.
            </p>
          )}
          {contributionResources.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-zinc-800/40">
              {contributionResources.map((resource) => (
                <Link
                  key={resource.key}
                  href={`/repos/${resource.repoId}?path=${encodeURIComponent(resource.path)}&view=blob`}
                  className="rounded-md border border-zinc-700 bg-zinc-900/40 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-all duration-200 hover:bg-zinc-800 hover:text-white"
                >
                  {resource.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* ── Member Posts ── */}
      {(space.recent_posts?.length ?? 0) > 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4">
          <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-zinc-800/50">
            <ChatBubbleIcon className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Member Reflections</span>
          </div>
          <div className="space-y-2">
            {space.recent_posts?.slice(0, 3).map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="block rounded-lg border border-zinc-800/50 bg-zinc-950/20 px-3 py-2.5 transition-all duration-200 hover:bg-zinc-900/40 hover:border-zinc-700"
              >
                <p className="line-clamp-2 text-sm leading-relaxed text-zinc-300">{post.content}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* ── Tech Stack ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4">
        <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <CodeBracketIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Tech Stack</span>
          </div>
          {stack.length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/40">
              {stack.length} {stack.length === 1 ? 'technology' : 'technologies'}
            </span>
          )}
        </div>
        {stackLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <TechStackPanel stack={stack} />
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-zinc-800/60 pt-4 flex flex-wrap justify-between items-center gap-3 text-xs text-zinc-500">
        <div>
          Created {formatRelativeTime(space.created_at)}
          {space.updated_at && space.updated_at !== space.created_at ? (
            <> · Updated {formatRelativeTime(space.updated_at)}</>
          ) : null}
        </div>
        {isOwnerOrMaintainer && (
          <Link
            href={`/spaces/${spaceId}/manage`}
            className="rounded-md bg-zinc-900/60 px-3 py-1 border border-zinc-800/80 font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-200"
          >
            Manage Space Settings
          </Link>
        )}
      </div>
    </div>
  );
}
