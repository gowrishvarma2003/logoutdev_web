"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSpace, useJoinRequests, useStack } from "@/lib/hooks/useSpaces";
import { useRepos } from "@/lib/hooks/useRepos";
import { useAuth } from "@/lib/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { StatusBadge, VisibilityBadge } from "@/components/spaces/SpaceBadges";
import TechStackPanel from "@/components/spaces/TechStackPanel";
import Spinner from "@/components/ui/Spinner";
import {
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleIcon,
  UsersIcon,
  TrashIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  GitHubIcon,
  LinkIcon,
  ExternalLinkIcon,
} from "@/components/ui/Icons";
import * as api from "@/lib/services/spacesApi";
import * as cache from "@/lib/services/requestCache";
import { formatRelativeTime } from "@/lib/utils";
import type { SpaceAccessAudience, SpaceAccessPolicy, SpaceAccessSection, SpaceStatus, SpaceVisibility, StackCategory, StackMaturity } from "@/lib/types";
import RichText from "@/components/ui/RichText";

const ACCESS_AUDIENCES: Array<{ value: SpaceAccessAudience; label: string }> = [
  { value: "public", label: "Public" },
  { value: "authenticated", label: "Logged in" },
  { value: "followers", label: "Followers" },
  { value: "contributors", label: "Contributors" },
  { value: "maintainers", label: "Maintainers" },
  { value: "owner", label: "Owner only" },
];

const ACCESS_SECTIONS: Array<{ value: SpaceAccessSection; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "work", label: "Work" },
  { value: "discussions", label: "Discussions" },
  { value: "updates", label: "Updates" },
  { value: "repos", label: "Repos" },
  { value: "people", label: "People" },
  { value: "followers", label: "Followers" },
  { value: "join_requests", label: "Join requests" },
  { value: "attachments", label: "Attachments" },
  { value: "health", label: "Health" },
  { value: "decisions", label: "Decisions" },
];

const DEFAULT_ACCESS_POLICY: Required<SpaceAccessPolicy> = {
  overview: "public",
  work: "public",
  discussions: "public",
  updates: "public",
  repos: "authenticated",
  people: "public",
  followers: "public",
  join_requests: "maintainers",
  attachments: "public",
  health: "public",
  decisions: "public",
};

function normalizePolicy(policy?: SpaceAccessPolicy | null): Required<SpaceAccessPolicy> {
  return { ...DEFAULT_ACCESS_POLICY, ...(policy ?? {}) };
}

export default function ManagePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { space, loading: spaceLoading, refetch: refetchSpace } = useSpace(spaceId);
  const canSeeJoinRequests = space?.viewer_permissions?.visible_sections?.join_requests !== false;
  const { requests, loading: reqLoading, refetch: refetchReqs } = useJoinRequests(spaceId, "pending", canSeeJoinRequests);
  const { stack, loading: stackLoading, refetch: refetchStack } = useStack(spaceId);
  const canSeeRepos = space?.viewer_permissions?.visible_sections?.repos !== false;
  const { repos } = useRepos(spaceId, canSeeRepos);

  if (spaceLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentMembership = space?.members?.find((member) => member.user_id === user?.id) ?? null;
  const isOwner = Boolean(space && space.owner_id === user?.id);
  const canManageSpace = Boolean(isOwner || currentMembership?.role === "maintainer" || space?.viewer_permissions?.can_manage_space);

  if (space && !canManageSpace) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="mb-2 text-lg font-semibold text-text-primary">Access Denied</h2>
        <p className="text-sm text-text-disabled">Only the project owner or maintainers can manage this space.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Linked Marketplace Launch banner */}
      <LinkedLaunchSection space={space} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main section (Left/Center Column) */}
        <div className="lg:col-span-2 space-y-6">
          {space?.viewer_permissions?.visible_sections?.join_requests !== false ? (
            <JoinRequestsSection spaceId={spaceId} requests={requests} loading={reqLoading} refetch={refetchReqs} />
          ) : null}
          {canSeeRepos ? <RepoManagementSection spaceId={spaceId} repos={repos} /> : null}
          {canSeeRepos ? <RepoDocsSection repos={repos} /> : null}
        </div>

        {/* Sidebar section (Right Column) */}
        <div className="space-y-6">
          {isOwner ? <ProjectSettingsSection space={space} refetch={refetchSpace} /> : null}
          {isOwner ? <VisibilitySettingsSection space={space} refetch={refetchSpace} /> : null}
          <StackManagementSection spaceId={spaceId} stack={stack} stackLoading={stackLoading} refetch={refetchStack} />
          {isOwner ? <DangerZoneSection space={space} onDelete={() => router.push("/spaces")} /> : null}
        </div>
      </div>
    </div>
  );
}

function LinkedLaunchSection({
  space,
}: {
  space: ReturnType<typeof useSpace>["space"];
}) {
  if (!space?.linked_launch) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-sky-500/10 bg-gradient-to-r from-sky-500/5 to-transparent p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-sky-400 border border-sky-500/10 mb-2">
            Marketplace Launch
          </span>
          <h3 className="text-base font-bold text-text-primary">{space.linked_launch.name}</h3>
          <p className="mt-1 text-sm text-text-muted">{space.linked_launch.tagline}</p>
          
          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-text-muted font-medium">
            <span className="capitalize">{space.linked_launch.status}</span>
            <span>·</span>
            <span>{space.linked_launch.upvote_count} upvotes</span>
            <span>·</span>
            <span>{space.linked_launch.review_count} reviews</span>
          </div>
        </div>

        <Link
          href={`/launches/${space.linked_launch.id}`}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-surface border border-border-default hover:border-border-strong px-4 py-2.5 text-xs font-semibold text-text-primary transition-all hover:bg-surface-hover"
        >
          Open Launch Page
          <ExternalLinkIcon className="w-3.5 h-3.5 text-text-muted" />
        </Link>
      </div>
    </div>
  );
}

function ProjectSettingsSection({
  space,
  refetch,
}: {
  space: ReturnType<typeof useSpace>["space"];
  refetch: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(space?.name ?? "");
  const [summary, setSummary] = useState(space?.summary ?? "");
  const [description, setDescription] = useState(space?.description ?? "");
  const [status, setStatus] = useState<SpaceStatus>(space?.status ?? "idea");
  const [visibility, setVisibility] = useState<SpaceVisibility>(space?.visibility ?? "public");
  const [workingInPublic, setWorkingInPublic] = useState(Boolean(space?.working_in_public));
  const [currentFocus, setCurrentFocus] = useState(space?.current_focus ?? "");
  const [openRoles, setOpenRoles] = useState((space?.open_roles ?? []).join(", "));
  const [neededSkills, setNeededSkills] = useState((space?.needed_skills ?? []).join(", "));
  const [contributionGuide, setContributionGuide] = useState(space?.contribution_guide ?? "");
  const [responseSla, setResponseSla] = useState(space?.response_sla ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!space) return;
    setName(space.name);
    setSummary(space.summary);
    setDescription(space.description ?? "");
    setStatus(space.status);
    setVisibility(space.visibility);
    setWorkingInPublic(Boolean(space.working_in_public));
    setCurrentFocus(space.current_focus ?? "");
    setOpenRoles((space.open_roles ?? []).join(", "));
    setNeededSkills((space.needed_skills ?? []).join(", "));
    setContributionGuide(space.contribution_guide ?? "");
    setResponseSla(space.response_sla ?? "");
  }, [space]);

  async function handleSave() {
    if (!space) return;
    setSaving(true);
    try {
      await api.updateSpace(space.id, {
        name: name.trim(),
        summary: summary.trim(),
        description: description.trim(),
        status,
        visibility,
        working_in_public: workingInPublic,
        current_focus: currentFocus.trim() || undefined,
        open_roles: openRoles.split(",").map((item) => item.trim()).filter(Boolean),
        needed_skills: neededSkills.split(",").map((item) => item.trim()).filter(Boolean),
        contribution_guide: contributionGuide.trim() || undefined,
        response_sla: responseSla.trim() || undefined,
      });
      cache.invalidateSpace(space.id);
      cache.invalidateSpaceListings();
      refetch();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!space) return null;

  return (
    <div className="rounded-2xl border border-border-default bg-surface/10 p-5 backdrop-blur-sm relative">
      <div className="flex items-center justify-between mb-4 border-b border-border-default/60 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary uppercase tracking-wide">
          <CogIcon className="w-4 h-4 text-text-muted" />
          Project Profile
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg bg-surface hover:bg-surface-hover border border-border-default px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors cursor-pointer"
          >
            Edit Profile
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-disabled mb-1">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border-default bg-app px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-disabled mb-1">Summary</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={300}
              className="w-full rounded-xl border border-border-default bg-app px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-disabled mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-border-default bg-app px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none transition-colors"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-disabled mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SpaceStatus)}
                className="w-full rounded-xl border border-border-default bg-app px-3 py-2 text-xs text-text-primary focus:border-border-strong focus:outline-none"
              >
                {["idea", "building", "shipping", "paused", "archived"].map((item) => (
                  <option key={item} value={item}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-text-disabled mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as SpaceVisibility)}
                className="w-full rounded-xl border border-border-default bg-app px-3 py-2 text-xs text-text-primary focus:border-border-strong focus:outline-none"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-border-default bg-app px-3 py-2.5 text-xs text-zinc-355 cursor-pointer">
            <input
              type="checkbox"
              checked={workingInPublic}
              onChange={(e) => setWorkingInPublic(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong bg-app"
            />
            Working in public
          </label>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-disabled mb-1">Current Focus</label>
            <input
              type="text"
              value={currentFocus}
              onChange={(e) => setCurrentFocus(e.target.value)}
              placeholder="e.g. shipping alpha"
              className="w-full rounded-xl border border-border-default bg-app px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-disabled mb-1">Open Roles</label>
            <input
              type="text"
              value={openRoles}
              onChange={(e) => setOpenRoles(e.target.value)}
              placeholder="React Engineer, Designer (comma separated)"
              className="w-full rounded-xl border border-border-default bg-app px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-disabled mb-1">Needed Skills</label>
            <input
              type="text"
              value={neededSkills}
              onChange={(e) => setNeededSkills(e.target.value)}
              placeholder="Next.js, UI Design (comma separated)"
              className="w-full rounded-xl border border-border-default bg-app px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-disabled mb-1">Contribution Guide</label>
            <textarea
              value={contributionGuide}
              onChange={(e) => setContributionGuide(e.target.value)}
              rows={3}
              placeholder="How people should contribute..."
              className="w-full resize-none rounded-xl border border-border-default bg-app px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-disabled mb-1">Response SLA</label>
            <input
              type="text"
              value={responseSla}
              onChange={(e) => setResponseSla(e.target.value)}
              placeholder="e.g. within 2 days"
              className="w-full rounded-xl border border-border-default bg-app px-3 py-2 text-xs text-text-primary placeholder:text-text-disabled focus:border-border-strong focus:outline-none transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-default/60 mt-3.5">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-2.5 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5 text-xs text-text-muted">
          <div className="grid grid-cols-2 gap-4 pb-2.5 border-b border-border-default/40">
            <div>
              <span className="block text-[9px] uppercase font-bold text-text-disabled mb-0.5">Status</span>
              <StatusBadge status={space.status} />
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-text-disabled mb-0.5">Visibility</span>
              <VisibilityBadge visibility={space.visibility} />
            </div>
          </div>

          <div className="pb-2.5 border-b border-border-default/40">
            <span className="block text-[9px] uppercase font-bold text-text-disabled mb-0.5">Project Details</span>
            <p className="text-sm font-semibold text-text-primary">{space.name}</p>
            <p className="mt-0.5 text-text-muted text-xs leading-relaxed">{space.summary}</p>
          </div>

          {space.description && (
            <div className="pb-2.5 border-b border-border-default/40">
              <span className="block text-[9px] uppercase font-bold text-text-disabled mb-0.5">Description</span>
              <p className="text-zinc-350 leading-relaxed text-xs whitespace-pre-line">{space.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pb-2.5 border-b border-border-default/40">
            <div>
              <span className="block text-[9px] uppercase font-bold text-text-disabled mb-0.5">Working in public</span>
              <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 border text-[10px] font-bold ${
                space.working_in_public 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" 
                  : "bg-surface-hover text-text-disabled border-border-default"
              }`}>
                {space.working_in_public ? "Yes" : "No"}
              </span>
            </div>
            {space.response_sla && (
              <div>
                <span className="block text-[9px] uppercase font-bold text-text-disabled mb-0.5">Response SLA</span>
                <span className="text-text-primary font-medium text-xs">{space.response_sla}</span>
              </div>
            )}
          </div>

          {space.current_focus && (
            <div className="pb-2.5 border-b border-border-default/40">
              <span className="block text-[9px] uppercase font-bold text-text-disabled mb-0.5">Current Focus</span>
              <p className="text-text-primary font-semibold text-xs">{space.current_focus}</p>
            </div>
          )}

          {(space.open_roles?.length ?? 0) > 0 && (
            <div className="pb-2.5 border-b border-border-default/40">
              <span className="block text-[9px] uppercase font-bold text-text-disabled mb-0.5">Open Roles</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {space.open_roles?.map((role) => (
                  <span key={role} className="rounded-lg bg-surface-hover border border-border-strong px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(space.needed_skills?.length ?? 0) > 0 && (
            <div className="pb-2.5 border-b border-border-default/40">
              <span className="block text-[9px] uppercase font-bold text-text-disabled mb-0.5">Needed Skills</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {space.needed_skills?.map((skill) => (
                  <span key={skill} className="rounded-lg bg-sky-500/10 border border-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-400">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {space.contribution_guide && (
            <div>
              <span className="block text-[9px] uppercase font-bold text-text-disabled mb-0.5">Contribution Guide</span>
              <p className="text-text-muted text-xs leading-relaxed whitespace-pre-line">
                {space.contribution_guide}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VisibilitySettingsSection({
  space,
  refetch,
}: {
  space: ReturnType<typeof useSpace>["space"];
  refetch: () => void;
}) {
  const [policy, setPolicy] = useState<Required<SpaceAccessPolicy>>(normalizePolicy(space?.access_policy));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPolicy(normalizePolicy(space?.access_policy));
  }, [space?.access_policy]);

  if (!space) return null;
  const currentSpaceId = space.id;

  async function handleSave() {
    setSaving(true);
    try {
      await api.updateSpace(currentSpaceId, { access_policy: policy });
      cache.invalidateSpace(currentSpaceId);
      cache.invalidateSpaceListings();
      refetch();
    } finally {
      setSaving(false);
    }
  }

  function updateSection(section: SpaceAccessSection, audience: SpaceAccessAudience) {
    setPolicy((current) => ({ ...current, [section]: audience }));
  }

  return (
    <div className="rounded-2xl border border-border-default bg-surface/10 p-5 backdrop-blur-sm">
      <div className="mb-4 border-b border-border-default/60 pb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary uppercase tracking-wide">
          <UsersIcon className="w-4 h-4 text-text-muted" />
          Visibility
        </h3>
        <p className="mt-1 text-xs text-text-disabled">Choose the minimum audience that can see each space section.</p>
      </div>

      <div className="space-y-2.5">
        {ACCESS_SECTIONS.map((section) => (
          <label key={section.value} className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-app px-3 py-2">
            <span className="text-xs font-semibold text-text-secondary">{section.label}</span>
            <select
              value={policy[section.value]}
              onChange={(event) => updateSection(section.value, event.target.value as SpaceAccessAudience)}
              className="rounded-lg border border-border-default bg-surface px-2 py-1 text-[11px] text-text-primary focus:border-border-strong focus:outline-none"
            >
              {ACCESS_AUDIENCES.map((audience) => (
                <option key={audience.value} value={audience.value}>
                  {audience.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 w-full rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
      >
        {saving ? "Saving..." : "Save Visibility"}
      </button>
    </div>
  );
}

function JoinRequestsSection({
  spaceId,
  requests,
  loading,
  refetch,
}: {
  spaceId: string;
  requests: ReturnType<typeof useJoinRequests>["requests"];
  loading: boolean;
  refetch: () => void;
}) {
  const [acting, setActing] = useState<string | null>(null);

  async function handleAction(requestId: string, action: "accept" | "reject" | "need-info") {
    setActing(requestId);
    try {
      await api.reviewJoinRequest(spaceId, requestId, action);
      cache.invalidateSpace(spaceId, "join-requests");
      cache.invalidateSpace(spaceId, "people");
      refetch();
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border-default bg-surface/10 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 border-b border-border-default/60 pb-3">
        <div className="flex items-center gap-2.5">
          <UsersIcon className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Pending Join Requests
          </h3>
          {requests.length > 0 && (
            <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-400">
              {requests.length}
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && requests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl bg-surface/5">
          <UsersIcon className="w-10 h-10 text-text-disabled mb-3" />
          <h4 className="text-sm font-semibold text-text-muted mb-1">No Pending Requests</h4>
          <p className="text-xs text-text-disabled max-w-[280px]">
            Join requests from interested developers will show up here.
          </p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex flex-col justify-between rounded-xl border border-border-default/80 bg-app/20 p-4 hover:border-border-strong/80 transition-all duration-200"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-border-subtle/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {request.applicant ? (
                      <>
                        <Link
                          href={`/profile/${request.applicant.username || request.applicant.id}`}
                          className="shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                        >
                          <Avatar user={request.applicant} size="sm" />
                        </Link>
                        <div className="min-w-0">
                          <Link
                            href={`/profile/${request.applicant.username || request.applicant.id}`}
                            className="hover:underline hover:text-sky-400 transition-colors cursor-pointer block truncate text-xs font-bold text-text-primary"
                          >
                            {request.applicant.name ?? "Unknown Developer"}
                          </Link>
                        </div>
                      </>
                    ) : (
                      <>
                        <Avatar user={null} size="sm" className="shrink-0" />
                        <div className="min-w-0">
                          <span className="block truncate text-xs font-bold text-text-primary">
                            Unknown Developer
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  <span className="text-[9px] text-text-disabled shrink-0">
                    {formatRelativeTime(request.created_at)}
                  </span>
                </div>

                {/* Message Box */}
                <div className="text-xs text-text-secondary leading-relaxed line-clamp-3 mb-3 whitespace-pre-line">
                  <RichText text={request.message} />
                </div>

                {/* Skills & Availability badges */}
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {request.skills && request.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-sky-500/5 border border-sky-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-sky-400"
                    >
                      {skill}
                    </span>
                  ))}
                  {request.availability_hours && (
                    <span className="rounded bg-violet-500/5 border border-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-violet-400">
                      {request.availability_hours}h/wk
                    </span>
                  )}
                </div>

                {/* Proof Links Row */}
                {request.proof_links && request.proof_links.length > 0 && (
                  <div className="mb-3.5 flex flex-wrap gap-1.5">
                    {request.proof_links.slice(0, 2).map((link, index) => {
                      const isGithub = link.includes("github.com");
                      return (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded border border-border-default bg-app/40 px-2 py-0.5 text-[9px] text-text-disabled hover:text-text-primary hover:border-border-strong transition-colors"
                        >
                          {isGithub ? <GitHubIcon className="w-2.5 h-2.5 text-text-disabled" /> : <LinkIcon className="w-2.5 h-2.5 text-text-disabled" />}
                          <span className="truncate max-w-[100px]">{link.replace(/^https?:\/\/(www\.)?/, "")}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Actions Row */}
              <div className="flex items-center gap-1.5 border-t border-border-subtle/60 pt-2.5 mt-auto">
                <button
                  onClick={() => handleAction(request.id, "accept")}
                  disabled={acting === request.id}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 py-1 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500 hover:text-primary-foreground transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircleIcon className="h-3 w-3" />
                  Accept
                </button>
                
                <button
                  onClick={() => handleAction(request.id, "need-info")}
                  disabled={acting === request.id}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 py-1 text-[10px] font-semibold text-amber-400 hover:bg-amber-500 hover:text-primary-foreground transition-all disabled:opacity-50 cursor-pointer"
                >
                  <ChatBubbleIcon className="h-3 w-3" />
                  Info
                </button>

                <button
                  onClick={() => handleAction(request.id, "reject")}
                  disabled={acting === request.id}
                  className="inline-flex items-center justify-center gap-1 rounded bg-surface border border-border-default px-2 py-1 text-[10px] font-semibold text-text-disabled hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  title="Reject"
                >
                  <XCircleIcon className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StackManagementSection({
  spaceId,
  stack,
  stackLoading,
  refetch,
}: {
  spaceId: string;
  stack: ReturnType<typeof useStack>["stack"];
  stackLoading: boolean;
  refetch: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState(
    stack.map((entry) => ({ category: entry.category, technology: entry.technology, maturity: entry.maturity }))
  );
  const [newTech, setNewTech] = useState("");
  const [newCat, setNewCat] = useState<StackCategory>("backend");
  const [newMat, setNewMat] = useState<StackMaturity>("in-use");
  const [saving, setSaving] = useState(false);

  function addItem() {
    if (!newTech.trim()) return;
    setItems((prev) => [...prev, { category: newCat, technology: newTech.trim(), maturity: newMat }]);
    setNewTech("");
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.replaceStack(spaceId, items);
      cache.invalidateSpace(spaceId);
      refetch();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border-default bg-surface/10 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 border-b border-border-default/60 pb-3">
        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
          Tech Stack
        </h3>
        {!editing && (
          <button
            onClick={() => {
              setItems(stack.map((entry) => ({ category: entry.category, technology: entry.technology, maturity: entry.maturity })));
              setEditing(true);
            }}
            className="rounded-lg bg-surface hover:bg-surface-hover border border-border-default px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors cursor-pointer"
          >
            Edit Stack
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3.5">
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div
                key={`${item.category}-${item.technology}-${index}`}
                className="flex items-center justify-between rounded-xl border border-border-default bg-app px-3 py-2"
              >
                <div className="min-w-0">
                  <span className="block text-[9px] uppercase font-bold text-text-disabled">
                    {item.category}
                  </span>
                  <span className="text-xs font-semibold text-text-primary truncate block mt-0.5">
                    {item.technology} <span className="text-[10px] text-text-disabled font-medium font-mono capitalize">({item.maturity})</span>
                  </span>
                </div>
                <button
                  onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== index))}
                  className="rounded p-1 text-text-disabled hover:bg-surface hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-xs text-text-disabled py-4 text-center">No technologies added yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-border-default bg-app/60 p-3 space-y-2.5">
            <span className="block text-[9px] uppercase font-bold text-text-muted">Add Technology</span>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-text-disabled uppercase font-semibold mb-1">Category</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as StackCategory)}
                  className="w-full rounded-lg border border-border-default bg-app px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-border-strong"
                >
                  {(["frontend", "backend", "database", "infra", "tooling", "other"] as StackCategory[]).map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[9px] text-text-disabled uppercase font-semibold mb-1">Maturity</label>
                <select
                  value={newMat}
                  onChange={(e) => setNewMat(e.target.value as StackMaturity)}
                  className="w-full rounded-lg border border-border-default bg-app px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-border-strong"
                >
                  <option value="in-use">In Use</option>
                  <option value="planned">Planned</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                placeholder="Technology (e.g. Next.js)"
                className="flex-1 rounded-lg border border-border-default bg-app px-2.5 py-1.5 text-xs text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-border-strong"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem();
                  }
                }}
              />
              <button
                type="button"
                onClick={addItem}
                className="rounded-lg bg-surface border border-border-default px-3 py-1.5 text-xs font-bold text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-default/60 mt-3.5">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-2.5 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
            >
              {saving ? "Saving..." : "Save Stack"}
            </button>
          </div>
        </div>
      ) : stackLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : (
        <TechStackPanel stack={stack} />
      )}
    </div>
  );
}

function RepoDocsSection({
  repos,
}: {
  repos: ReturnType<typeof useRepos>["repos"];
}) {
  const resources = repos.flatMap((repo) =>
    (repo.community_files ?? []).map((file) => ({
      key: `${repo.id}:${file.key}`,
      repoId: repo.id,
      repoName: repo.name,
      label: file.key,
      path: file.path,
    }))
  );

  if (resources.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border-default bg-surface/10 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 border-b border-border-default/60 pb-3">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Contribution Resources
          </h3>
          <span className="rounded-full bg-surface-hover border border-border-strong/60 px-2 py-0.5 text-xs font-bold text-text-muted">
            {resources.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resources.map((resource) => (
          <Link
            key={resource.key}
            href={`/repos/${resource.repoId}?path=${encodeURIComponent(resource.path)}&view=blob`}
            className="flex items-center gap-3 rounded-xl border border-border-default/80 bg-app/20 px-4 py-3 hover:border-border-strong hover:bg-surface/10 transition-all duration-200"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface border border-border-default text-sky-400">
              <DocumentTextIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-text-primary">{resource.label}</p>
              <p className="truncate text-[10px] text-text-disabled font-medium">{resource.repoName}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RepoManagementSection({
  spaceId,
  repos,
}: {
  spaceId: string;
  repos: ReturnType<typeof useRepos>["repos"];
}) {
  return (
    <div className="rounded-2xl border border-border-default bg-surface/10 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 border-b border-border-default/60 pb-3">
        <div className="flex items-center gap-2">
          <CodeBracketIcon className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Repositories
          </h3>
          {repos.length > 0 && (
            <span className="rounded-full bg-surface-hover border border-border-strong/60 px-2 py-0.5 text-xs font-bold text-text-muted">
              {repos.length}
            </span>
          )}
        </div>
        
        <Link
          href={`/spaces/${spaceId}/repos`}
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
        >
          Manage Repositories →
        </Link>
      </div>

      {repos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl bg-surface/5">
          <CodeBracketIcon className="w-10 h-10 text-text-disabled mb-3" />
          <h4 className="text-sm font-semibold text-text-muted mb-1">No Repositories</h4>
          <p className="text-xs text-text-disabled max-w-[280px]">
            Connect private repositories to manage your code directly from the Space.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {repos.map((repo) => (
            <div
              key={repo.id}
              className="group relative rounded-xl border border-border-default bg-app/20 p-4 hover:border-border-strong hover:bg-surface/10 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/repos/${repo.id}`}
                    className="hover:underline hover:text-sky-400 transition-colors cursor-pointer block truncate text-sm font-bold text-text-primary"
                  >
                    {repo.name}
                  </Link>
                </div>
                
                <Link
                  href={`/spaces/${spaceId}/repos/${repo.id}/settings`}
                  className="rounded-lg p-1.5 text-text-disabled hover:bg-surface-hover hover:text-text-primary transition-colors shrink-0"
                  title="Repo Settings"
                >
                  <CogIcon className="w-3.5 h-3.5" />
                </Link>
              </div>

              <p className="line-clamp-2 text-xs text-text-muted h-8 mb-3">
                {repo.description || "No description provided."}
              </p>

              <div className="flex items-center justify-between border-t border-border-subtle/80 pt-2.5">
                <span className="inline-flex items-center gap-1 rounded-md bg-surface border border-border-default px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                  <svg className="w-3 h-3 text-text-disabled" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="18" r="3" />
                    <circle cx="6" cy="6" r="3" />
                    <circle cx="6" cy="18" r="3" />
                    <path d="M6 9v6" />
                    <path d="M9 15h6v3" />
                  </svg>
                  {repo.default_branch}
                </span>

                <Link
                  href={`/repos/${repo.id}`}
                  className="text-[11px] font-semibold text-text-disabled hover:text-text-primary hover:underline transition-colors cursor-pointer"
                >
                  Explore Files →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DangerZoneSection({
  space,
  onDelete,
}: {
  space: ReturnType<typeof useSpace>["space"];
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!space) return;
    if (!confirm("Archive this space? It can be restored later.")) return;
    setDeleting(true);
    try {
      await api.deleteSpace(space.id);
      cache.invalidateSpace(space.id);
      cache.invalidateSpaceListings();
      onDelete();
    } catch {
      setDeleting(false);
    }
  }

  if (!space) return null;

  return (
    <div className="rounded-2xl border border-rose-500/10 bg-rose-500/[0.01] p-5 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wide mb-2">
        Danger Zone
      </h3>
      <p className="text-xs text-text-disabled mb-3.5 leading-relaxed">
        Archiving this space will hide it from the search index and your active active spaces list. Contributors will no longer be able to submit join requests. You can restore it later if needed.
      </p>
      
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="w-full rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 hover:text-rose-350 disabled:opacity-50 transition-colors text-center cursor-pointer"
      >
        {deleting ? "Archiving Space..." : "Archive Space"}
      </button>
    </div>
  );
}
