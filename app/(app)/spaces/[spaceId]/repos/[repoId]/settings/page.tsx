"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useContributors, useSpace } from "@/lib/hooks/useSpaces";
import { useRepo, useRepoMembers } from "@/lib/hooks/useRepos";
import * as api from "@/lib/services/spacesApi";
import { EmptyState, SectionHeader } from "@/components/spaces/SpaceBadges";
import Spinner from "@/components/ui/Spinner";
import { CogIcon, LockIcon, UsersIcon } from "@/components/ui/Icons";

export default function RepoSettingsPage({
  params,
}: {
  params: Promise<{ spaceId: string; repoId: string }>;
}) {
  const { spaceId, repoId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { space } = useSpace(spaceId);
  const { contributors } = useContributors(spaceId);
  const { repo, loading: repoLoading, error, refetch } = useRepo(spaceId, repoId);
  const { members, loading: membersLoading, refetch: refetchMembers } = useRepoMembers(spaceId, repoId);

  const currentMembership = contributors.find((member) => member.user_id === user?.id) ?? null;
  const canManage = space?.owner_id === user?.id || currentMembership?.role === "maintainer";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [saving, setSaving] = useState(false);
  const [candidateId, setCandidateId] = useState("");
  const [candidateRole, setCandidateRole] = useState<"read" | "write">("read");
  const [memberSaving, setMemberSaving] = useState(false);

  useEffect(() => {
    if (repo) {
      setName(repo.name);
      setDescription(repo.description ?? "");
      setSlug(repo.slug);
      setDefaultBranch(repo.default_branch);
    }
  }, [repo]);

  const candidateOptions = contributors.filter((member) => {
    if (member.role !== "contributor") return false;
    return !members.some((repoMember) => repoMember.user_id === member.user_id);
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!repo) return;

    setSaving(true);
    try {
      await api.updateRepo(spaceId, repo.id, {
        name: name.trim(),
        description: description.trim(),
        slug: slug.trim(),
        default_branch: defaultBranch.trim(),
      });
      refetch();
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!repo) return;
    if (!confirm(`Archive ${repo.name}?`)) return;

    await api.archiveRepo(spaceId, repo.id);
    router.push(`/spaces/${spaceId}/repos`);
  }

  async function handleAddMember() {
    if (!candidateId) return;
    setMemberSaving(true);
    try {
      await api.upsertRepoMember(spaceId, repoId, candidateId, candidateRole);
      setCandidateId("");
      setCandidateRole("read");
      refetchMembers();
    } finally {
      setMemberSaving(false);
    }
  }

  async function handleRoleChange(userId: string, role: "read" | "write") {
    await api.upsertRepoMember(spaceId, repoId, userId, role);
    refetchMembers();
  }

  async function handleRemove(userId: string) {
    await api.removeRepoMember(spaceId, repoId, userId);
    refetchMembers();
  }

  if (repoLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!canManage || !repo) {
    return (
      <EmptyState
        icon={<LockIcon className="w-10 h-10" />}
        title="Repo settings unavailable"
        description={error || "Only the space owner or maintainers can manage repository settings."}
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
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            />
            <input
              type="text"
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-xs text-zinc-500">
            <div>
              <p className="font-medium text-zinc-300">Admin access</p>
              <p>Space owner and maintainers always retain repository admin access automatically.</p>
            </div>
            <CogIcon className="h-4 w-4 text-zinc-500" />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </section>

      <section>
        <SectionHeader title="Repo Allowlist" count={members.length} />
        <div className="space-y-4 px-4 py-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
              <UsersIcon className="h-4 w-4 text-zinc-500" />
              Add contributor access
            </div>
            <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
              <select
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
              >
                <option value="">Select contributor</option>
                {candidateOptions.map((member) => (
                  <option key={member.id} value={member.user_id}>
                    {member.user?.name ?? member.user_id}
                  </option>
                ))}
              </select>
              <select
                value={candidateRole}
                onChange={(e) => setCandidateRole(e.target.value as "read" | "write")}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none"
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
              </select>
              <button
                onClick={handleAddMember}
                disabled={!candidateId || memberSaving}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
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
              description="Only space owner and maintainers can access this repo until you add contributors."
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
                    onChange={(e) => handleRoleChange(member.user_id, e.target.value as "read" | "write")}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-white focus:border-zinc-600 focus:outline-none"
                  >
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                  </select>
                  <button
                    onClick={() => handleRemove(member.user_id)}
                    className="rounded-lg px-2 py-1 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
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
            className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            Archive Repository
          </button>
        </div>
      </section>
    </div>
  );
}
