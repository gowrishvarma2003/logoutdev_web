"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBranches, useRepo, useRepoAccess } from "@/lib/hooks/useRepos";
import { useSpaceList } from "@/lib/hooks/useSpaces";
import * as reposApi from "@/lib/services/reposApi";
import type { RepoCollaboratorCandidate, RepoRole } from "@/lib/types";
import { EmptyState, SectionHeader } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { CogIcon, LockIcon, UsersIcon } from "@/components/ui/Icons";

const BASE_ROLES: RepoRole[] = ["read", "triage", "write", "maintain"];

function roleOptions(isPersonalRepo: boolean): RepoRole[] {
  return isPersonalRepo ? [...BASE_ROLES, "admin"] : BASE_ROLES;
}

export default function RepoSettingsPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const router = useRouter();
  const { repo, loading: repoLoading, error, refetch } = useRepo(repoId);
  const { collaborators, loading: accessLoading, refetch: refetchAccess } = useRepoAccess(repoId);
  const { branches } = useBranches(repoId);
  const { data: spacesData, loading: spacesLoading, error: spacesError } = useSpaceList({ mine: true, page: 1, limit: 100 });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [attachmentSaving, setAttachmentSaving] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<RepoCollaboratorCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<RepoCollaboratorCandidate | null>(null);
  const [candidateRole, setCandidateRole] = useState<RepoRole>("read");
  const [memberSaving, setMemberSaving] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!repo) return;
    setName(repo.name);
    setDescription(repo.description ?? "");
    setSlug(repo.slug);
    setDefaultBranch(repo.default_branch);
    setVisibility(repo.visibility);
    setSelectedSpaceId(repo.attached_space?.id ?? "");
  }, [repo]);

  useEffect(() => {
    if (!repo) return;
    let cancelled = false;
    if (!search.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    reposApi.searchRepositoryCollaborators(repo.id, search.trim())
      .then((response) => {
        if (!cancelled) {
          setResults(response.users);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSearching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repo, search]);

  const spaces = spacesData?.spaces ?? [];
  const isPersonalRepo = !repo?.space_id;
  const availableRoles = useMemo(() => roleOptions(isPersonalRepo), [isPersonalRepo]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!repo) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      await reposApi.updateRepository(repo.id, {
        name: name.trim(),
        description: description.trim(),
        slug: slug.trim(),
        default_branch: defaultBranch.trim(),
        visibility,
      });
      refetch();
      setSaveSuccess("Repository settings saved.");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to save repository settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!repo) return;
    if (deleteConfirmName !== repo.name) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await reposApi.deleteRepository(repo.id);
      router.push("/repos");
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete repository.");
      setDeleting(false);
    }
  }

  async function handleAttachmentSave() {
    if (!repo) return;
    setAttachmentSaving(true);
    setAttachmentError(null);
    try {
      if (selectedSpaceId) {
        await reposApi.setRepositoryAttachment(repo.id, { space_id: selectedSpaceId });
      } else {
        await reposApi.removeRepositoryAttachment(repo.id);
      }
      refetch();
    } catch (err: unknown) {
      setAttachmentError(err instanceof Error ? err.message : "Failed to update attachment.");
    } finally {
      setAttachmentSaving(false);
    }
  }

  async function handleAddMember() {
    if (!repo || !selectedUser) return;
    setMemberSaving(true);
    try {
      await reposApi.upsertRepositoryMember(repo.id, selectedUser.id, candidateRole);
      setSearch("");
      setResults([]);
      setSelectedUser(null);
      setCandidateRole("read");
      refetchAccess();
      refetch();
    } finally {
      setMemberSaving(false);
    }
  }

  async function handleRoleChange(userId: string, role: RepoRole) {
    if (!repo) return;
    await reposApi.upsertRepositoryMember(repo.id, userId, role);
    refetchAccess();
    refetch();
  }

  async function handleRemove(userId: string) {
    if (!repo) return;
    await reposApi.removeRepositoryMember(repo.id, userId);
    refetchAccess();
    refetch();
  }

  if (repoLoading || accessLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!repo) {
    return (
      <EmptyState
        icon={<LockIcon className="w-10 h-10" />}
        title="Repo settings unavailable"
        description={error || "You do not have access to this repository."}
      />
    );
  }

  if (!repo.can_manage_general && !repo.can_manage_access && !repo.can_manage_rules) {
    return (
      <EmptyState
        icon={<LockIcon className="w-10 h-10" />}
        title="Settings unavailable"
        description="You need repository admin or maintainer access to manage this repo."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-white">Repository settings</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Effective role: <span className="font-medium text-zinc-300">{repo.effective_role || "no access"}</span>
              {repo.inherited_role ? ` / inherited ${repo.inherited_role}` : ""}
              {repo.direct_role ? ` / direct ${repo.direct_role}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href={`/repos/${repo.id}/settings`} className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200">
              General
            </Link>
            <Link href={`/repos/${repo.id}/settings#access`} className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200">
              Access
            </Link>
            <Link href={`/repos/${repo.id}/settings/branches`} className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200">
              Branches &amp; Rules
            </Link>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <SectionHeader title="General" />
        <form onSubmit={handleSave} className="space-y-4 px-4 py-4">
          {saveError ? (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {saveError}
            </div>
          ) : null}
          {saveSuccess ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {saveSuccess}
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Repository name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setSaveError(null);
                  setSaveSuccess(null);
                }}
                disabled={!repo.can_manage_general}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none disabled:opacity-60"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">URL slug</span>
              <input
                type="text"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setSaveError(null);
                  setSaveSuccess(null);
                }}
                disabled={!repo.can_manage_general}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none disabled:opacity-60"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Description</span>
            <textarea
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setSaveError(null);
                setSaveSuccess(null);
              }}
              rows={3}
              disabled={!repo.can_manage_general}
              className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none disabled:opacity-60"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Default branch</span>
              <select
                value={defaultBranch}
                onChange={(event) => {
                  setDefaultBranch(event.target.value);
                  setSaveError(null);
                  setSaveSuccess(null);
                }}
                disabled={!repo.can_manage_general || branches.length === 0}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none disabled:opacity-60"
              >
                {branches.length === 0 ? (
                  <option value={defaultBranch}>{defaultBranch}</option>
                ) : branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Visibility</span>
              <select
                value={visibility}
                onChange={(event) => {
                  setVisibility(event.target.value as "public" | "private");
                  setSaveError(null);
                  setSaveSuccess(null);
                }}
                disabled={!repo.can_manage_general}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none disabled:opacity-60"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </label>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500">
            <div>
              <p className="font-medium text-zinc-300">Admin-only controls</p>
              <p>Visibility, repo home binding, and access controls follow repository admin access.</p>
            </div>
            <CogIcon className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !repo.can_manage_general}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <SectionHeader title="Org / Space Binding" />
        <div className="space-y-4 px-4 py-4">
          <p className="text-sm text-zinc-500">
            Spaces act as the organization layer for attached repositories. Space owners inherit admin access and maintainers inherit maintain access.
          </p>
          <select
            value={selectedSpaceId}
            onChange={(event) => {
              setSelectedSpaceId(event.target.value);
              setAttachmentError(null);
            }}
            disabled={spacesLoading || attachmentSaving || !repo.can_manage_general}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none disabled:opacity-60"
          >
            <option value="">No attached space</option>
            {spacesLoading ? <option value="" disabled>Loading your spaces...</option> : null}
            {!spacesLoading && spaces.length === 0 ? <option value="" disabled>No spaces available</option> : null}
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
          {spacesError ? <p className="text-xs text-rose-400">{spacesError}</p> : null}
          {attachmentError ? <p className="text-xs text-rose-400">{attachmentError}</p> : null}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500">
            <div>
              <p className="font-medium text-zinc-300">Current binding</p>
              <p>{repo.attached_space ? repo.attached_space.name : "This repo is unattached."}</p>
            </div>
            {repo.attached_space ? (
              <Link href={`/spaces/${repo.attached_space.id}/repos`} className="text-sky-400 hover:text-sky-300">
                Open space
              </Link>
            ) : null}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAttachmentSave}
              disabled={spacesLoading || attachmentSaving || !repo.can_manage_general}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-50"
            >
              {attachmentSaving ? "Saving..." : "Save attachment"}
            </button>
          </div>
        </div>
      </section>

      <section id="access" className="rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <SectionHeader title="Access" count={collaborators.length} />
        <div className="space-y-4 px-4 py-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              <UsersIcon className="h-4 w-4 text-zinc-500" />
              Search and add collaborators
            </div>
            <div className="space-y-3">
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSelectedUser(null);
                }}
                placeholder="Search by username, name, or email"
                disabled={!repo.can_manage_access}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-60"
              />
              {searching ? <p className="text-xs text-zinc-500">Searching...</p> : null}
              {!searching && results.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  {results.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(candidate);
                        setSearch(candidate.username || candidate.email || candidate.name);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${selectedUser?.id === candidate.id ? "bg-zinc-800" : "hover:bg-zinc-900"}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{candidate.name}</p>
                        <p className="text-xs text-zinc-500">@{candidate.username || candidate.email}</p>
                      </div>
                      <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                        {candidate.effective_role || "no access"}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-400">
                  {selectedUser ? `${selectedUser.name} / @${selectedUser.username || selectedUser.email}` : "Select a user from search results"}
                </div>
                <select
                  value={candidateRole}
                  onChange={(event) => setCandidateRole(event.target.value as RepoRole)}
                  disabled={!repo.can_manage_access}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none disabled:opacity-60"
                >
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={!selectedUser || memberSaving || !repo.can_manage_access}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-50"
                >
                  {memberSaving ? "Saving..." : "Send invite"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs text-zinc-500">
            <p className="font-medium text-zinc-300">Effective access model</p>
            <p className="mt-1">
              Personal repo owner = admin. Attached Space owner = inherited admin. Attached Space maintainer = inherited maintain. Direct collaborators can be outside the Space.
            </p>
          </div>

          {collaborators.length === 0 ? (
            <EmptyState
              icon={<LockIcon className="w-10 h-10" />}
              title="No collaborators yet"
              description="Inherited owners and maintainers will appear here once the repo is attached to a Space or direct collaborators are added."
            />
          ) : (
            <div className="divide-y divide-zinc-800/60 rounded-2xl border border-zinc-800">
              {collaborators.map((member) => (
                <div key={member.id} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{member.user?.name ?? member.user_id}</p>
                    <p className="truncate text-xs text-zinc-500">@{member.user?.username || member.user?.email || member.user_id}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                      {member.source?.replaceAll("_", " ") || "collaborator"}
                      {member.is_outside_collaborator ? " / outside collaborator" : ""}
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>
                          Effective: <span className="font-semibold text-white">{member.effective_role || "none"}</span>
                        </span>
                        {member.status === "pending" ? (
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                            Pending invite
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-zinc-500">
                        Direct {member.direct_role || "none"} / Inherited {member.inherited_role || "none"}
                      </div>
                    </div>
                    {member.direct_role ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={member.direct_role}
                          onChange={(event) => handleRoleChange(member.user_id, event.target.value as RepoRole)}
                          disabled={!repo.can_manage_access}
                          className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-white focus:border-zinc-600 focus:outline-none disabled:opacity-60"
                        >
                          {availableRoles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemove(member.user_id)}
                          disabled={!repo.can_manage_access}
                          className="rounded-lg px-2 py-2 text-xs text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-60"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-500">
                        Inherited access is managed from the repo owner or attached Space.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <SectionHeader title="Branches & Rules" />
        <div className="space-y-3 px-4 py-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-400">
            <p className="font-medium text-white">Protected branch controls</p>
            <p className="mt-1">
              Manage pull-request requirements, review counts, status checks, force-push rules, and push-role minimums from the branch rules page.
            </p>
          </div>
          <div className="flex justify-end">
            <Link
              href={`/repos/${repo.id}/settings/branches`}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
            >
              Open branch rules
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50">
        <SectionHeader title="Danger Zone" />
        <div className="space-y-4 px-4 py-4">
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3">
            <p className="text-sm font-medium text-rose-200">Delete this repository</p>
            <p className="mt-1 text-xs text-rose-300/80">
              This permanently removes the repo record, Git storage, releases, pull requests, discussions, stars, watchers, collaborators, and fork links. Space work items and updates will remain but lose their repo link.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={deleteConfirmName}
              onChange={(event) => {
                setDeleteConfirmName(event.target.value);
                setDeleteError(null);
              }}
              placeholder={`Type ${repo.name} to confirm`}
              disabled={!repo.can_delete || deleting}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleDelete}
              disabled={!repo.can_delete || deleting || deleteConfirmName !== repo.name}
              className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete Repository"}
            </button>
          </div>
          {!repo.can_delete ? (
            <p className="text-xs text-zinc-500">Only the repository owner can permanently delete this repository.</p>
          ) : null}
          {deleteError ? <p className="text-xs text-rose-400">{deleteError}</p> : null}
        </div>
      </section>
    </div>
  );
}
