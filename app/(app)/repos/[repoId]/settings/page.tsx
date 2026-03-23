"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRepo, useRepoMembers } from "@/lib/hooks/useRepos";
import { useSpaceList } from "@/lib/hooks/useSpaces";
import * as reposApi from "@/lib/services/reposApi";
import { EmptyState, SectionHeader } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { CogIcon, LockIcon, UsersIcon } from "@/components/ui/Icons";

export default function RepoSettingsPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);
  const router = useRouter();
  const { repo, loading: repoLoading, error, refetch } = useRepo(repoId);
  const { members, loading: membersLoading, refetch: refetchMembers } = useRepoMembers(repoId);
  const { data: spacesData } = useSpaceList({ mine: true, page: 1, limit: 100 });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [visibility, setVisibility] = useState<"public" | "private">("private");
  const [saving, setSaving] = useState(false);
  const [candidateId, setCandidateId] = useState("");
  const [candidateRole, setCandidateRole] = useState<"read" | "write">("read");
  const [memberSaving, setMemberSaving] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState("");
  const [attachmentSaving, setAttachmentSaving] = useState(false);

  useEffect(() => {
    if (!repo) return;
    setName(repo.name);
    setDescription(repo.description ?? "");
    setSlug(repo.slug);
    setDefaultBranch(repo.default_branch);
    setVisibility(repo.visibility);
    setSelectedSpaceId(repo.attached_space?.id ?? "");
  }, [repo]);

  const spaces = spacesData?.spaces ?? [];

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!repo) return;

    setSaving(true);
    try {
      await reposApi.updateRepository(repo.id, {
        name: name.trim(),
        description: description.trim(),
        slug: slug.trim(),
        default_branch: defaultBranch.trim(),
        visibility,
      });
      refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!repo) return;
    if (!confirm(`Archive ${repo.name}?`)) return;

    await reposApi.archiveRepository(repo.id);
    router.push("/repos");
  }

  async function handleAddMember() {
    if (!candidateId) return;
    setMemberSaving(true);
    try {
      await reposApi.upsertRepositoryMember(repoId, candidateId, candidateRole);
      setCandidateId("");
      setCandidateRole("read");
      refetchMembers();
    } finally {
      setMemberSaving(false);
    }
  }

  async function handleRoleChange(userId: string, role: "read" | "write") {
    await reposApi.upsertRepositoryMember(repoId, userId, role);
    refetchMembers();
  }

  async function handleRemove(userId: string) {
    await reposApi.removeRepositoryMember(repoId, userId);
    refetchMembers();
  }

  async function handleAttachmentSave() {
    setAttachmentSaving(true);
    try {
      if (selectedSpaceId) {
        await reposApi.setRepositoryAttachment(repoId, { space_id: selectedSpaceId });
      } else {
        await reposApi.removeRepositoryAttachment(repoId);
      }
      refetch();
    } finally {
      setAttachmentSaving(false);
    }
  }

  if (repoLoading) {
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
        description={error || "Only repository admins can manage settings."}
      />
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      <section>
        <SectionHeader title="Repository Settings" />
        <form onSubmit={handleSave} className="space-y-3 px-4 py-4">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            />
            <input
              type="text"
              value={defaultBranch}
              onChange={(event) => setDefaultBranch(event.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            />
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as "public" | "private")}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500">
            <div>
              <p className="font-medium text-zinc-300">Admin access</p>
              <p>Repo owners and attached space maintainers retain repository admin access automatically.</p>
            </div>
            <CogIcon className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <SectionHeader title="Attached Space" />
        <div className="space-y-3 px-4 py-4">
          <select
            value={selectedSpaceId}
            onChange={(event) => setSelectedSpaceId(event.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
          >
            <option value="">No attached space</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.name}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500">
            <div>
              <p className="font-medium text-zinc-300">Current space</p>
              <p>{repo.attached_space ? repo.attached_space.name : "This repo is unattached."}</p>
            </div>
            {repo.attached_space ? (
              <a href={`/spaces/${repo.attached_space.id}/repos`} className="text-sky-400 hover:text-sky-300">
                Open space →
              </a>
            ) : null}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAttachmentSave}
              disabled={attachmentSaving}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-50"
            >
              {attachmentSaving ? "Saving..." : "Save attachment"}
            </button>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader title="Repo Allowlist" count={members.length} />
        <div className="space-y-4 px-4 py-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              <UsersIcon className="h-4 w-4 text-zinc-500" />
              Add collaborator access
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <input
                value={candidateId}
                onChange={(event) => setCandidateId(event.target.value)}
                placeholder="User ID"
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              />
              <select
                value={candidateRole}
                onChange={(event) => setCandidateRole(event.target.value as "read" | "write")}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
              </select>
              <button
                onClick={handleAddMember}
                disabled={!candidateId || memberSaving}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {membersLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : members.length === 0 ? (
            <EmptyState
              icon={<LockIcon className="w-10 h-10" />}
              title="No explicit repo members yet"
              description="This repo relies on owner and attached-space admin access until you add collaborators."
            />
          ) : (
            <div className="divide-y divide-zinc-800/60 rounded-2xl border border-zinc-800">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{member.user?.name ?? member.user_id}</p>
                    <p className="truncate text-xs text-zinc-500">{member.user?.email}</p>
                  </div>
                  <select
                    value={member.role}
                    onChange={(event) => handleRoleChange(member.user_id, event.target.value as "read" | "write")}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-white focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                  </select>
                  <button
                    onClick={() => handleRemove(member.user_id)}
                    className="rounded-lg px-2 py-1 text-xs text-rose-400 transition-colors hover:bg-rose-500/10"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <SectionHeader title="Danger Zone" />
        <div className="px-4 py-4">
          <button
            onClick={handleArchive}
            className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-colors hover:bg-rose-500/10"
          >
            Archive Repository
          </button>
        </div>
      </section>
    </div>
  );
}
