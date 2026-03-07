"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSpace, useJoinRequests, useStack } from "@/lib/hooks/useSpaces";
import { useRepos } from "@/lib/hooks/useRepos";
import { useAuth } from "@/lib/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import { SectionHeader, EmptyState } from "@/components/spaces/SpaceBadges";
import TechStackPanel from "@/components/spaces/TechStackPanel";
import Spinner from "@/components/ui/Spinner";
import {
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleIcon,
  UsersIcon,
} from "@/components/ui/Icons";
import * as api from "@/lib/services/spacesApi";
import { formatRelativeTime } from "@/lib/utils";
import type { SpaceStatus, SpaceVisibility, StackCategory, StackMaturity } from "@/lib/types";

export default function ManagePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { space, refetch: refetchSpace } = useSpace(spaceId);
  const { requests, loading: reqLoading, refetch: refetchReqs } = useJoinRequests(spaceId, "pending");
  const { stack, refetch: refetchStack } = useStack(spaceId);
  const { repos } = useRepos(spaceId);

  if (space && space.owner_id !== user?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="mb-2 text-lg font-semibold text-white">Access Denied</h2>
        <p className="text-sm text-zinc-500">Only the project owner can manage this space.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      <ProjectSettingsSection space={space} refetch={refetchSpace} onDelete={() => router.push("/spaces")} />
      <JoinRequestsSection spaceId={spaceId} requests={requests} loading={reqLoading} refetch={refetchReqs} />
      <StackManagementSection spaceId={spaceId} stack={stack} refetch={refetchStack} />
      <RepoManagementSection spaceId={spaceId} repos={repos} />
    </div>
  );
}

function ProjectSettingsSection({
  space,
  refetch,
  onDelete,
}: {
  space: ReturnType<typeof useSpace>["space"];
  refetch: () => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(space?.name ?? "");
  const [summary, setSummary] = useState(space?.summary ?? "");
  const [description, setDescription] = useState(space?.description ?? "");
  const [status, setStatus] = useState<SpaceStatus>(space?.status ?? "idea");
  const [visibility, setVisibility] = useState<SpaceVisibility>(space?.visibility ?? "public");
  const [repoUrl, setRepoUrl] = useState(space?.primary_repo_url ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!space) return;
    setName(space.name);
    setSummary(space.summary);
    setDescription(space.description ?? "");
    setStatus(space.status);
    setVisibility(space.visibility);
    setRepoUrl(space.primary_repo_url ?? "");
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
        primary_repo_url: repoUrl.trim() || undefined,
      });
      refetch();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!space) return;
    if (!confirm("Archive this space? It can be restored later.")) return;
    setDeleting(true);
    try {
      await api.deleteSpace(space.id);
      onDelete();
    } catch {
      setDeleting(false);
    }
  }

  if (!space) return null;

  return (
    <section className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <CogIcon className="w-4 h-4" />
          Project Settings
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none transition-colors"
          />
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={300}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none transition-colors"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-600 focus:outline-none transition-colors"
          />
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="External repository URL"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none transition-colors"
          />
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SpaceStatus)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
            >
              {["idea", "building", "shipping", "paused", "archived"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as SpaceVisibility)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm text-zinc-400">
          <p><span className="text-zinc-500">Name:</span> <span className="text-white">{space.name}</span></p>
          <p><span className="text-zinc-500">Summary:</span> {space.summary}</p>
          <p><span className="text-zinc-500">Status:</span> {space.status}</p>
          <p><span className="text-zinc-500">Visibility:</span> {space.visibility}</p>
          {space.primary_repo_url && <p><span className="text-zinc-500">External Repo:</span> {space.primary_repo_url}</p>}
        </div>
      )}

      <div className="mt-6 border-t border-zinc-800 pt-4">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 disabled:opacity-50 transition-colors"
        >
          {deleting ? "Archiving..." : "Archive Space"}
        </button>
      </div>
    </section>
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
      refetch();
    } finally {
      setActing(null);
    }
  }

  return (
    <section>
      <SectionHeader title="Pending Join Requests" count={requests.length} />

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {!loading && requests.length === 0 && (
        <EmptyState
          icon={<UsersIcon className="w-10 h-10" />}
          title="No pending requests"
          description="Join requests from interested contributors will appear here."
        />
      )}

      {!loading && requests.length > 0 && (
        <div className="divide-y divide-zinc-800/50">
          {requests.map((request) => (
            <div key={request.id} className="px-4 py-4">
              <div className="flex items-start gap-3">
                <Avatar user={request.applicant} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{request.applicant?.name ?? "Unknown"}</p>
                    <span className="text-[11px] text-zinc-500">{formatRelativeTime(request.created_at)}</span>
                  </div>

                  <p className="mb-2 text-sm text-zinc-300">{request.message}</p>

                  {request.skills && request.skills.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {request.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {request.availability_hours && (
                    <p className="mb-2 text-[11px] text-zinc-500">
                      Available {request.availability_hours} hrs/week
                    </p>
                  )}

                  {request.proof_links && request.proof_links.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {request.proof_links.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-sky-400 underline hover:text-sky-300"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(request.id, "accept")}
                      disabled={acting === request.id}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(request.id, "need-info")}
                      disabled={acting === request.id}
                      className="flex items-center gap-1 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                    >
                      <ChatBubbleIcon className="h-3.5 w-3.5" />
                      Need Info
                    </button>
                    <button
                      onClick={() => handleAction(request.id, "reject")}
                      disabled={acting === request.id}
                      className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                    >
                      <XCircleIcon className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StackManagementSection({
  spaceId,
  stack,
  refetch,
}: {
  spaceId: string;
  stack: ReturnType<typeof useStack>["stack"];
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
      refetch();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Tech Stack</h3>
        {!editing && (
          <button
            onClick={() => {
              setItems(stack.map((entry) => ({ category: entry.category, technology: entry.technology, maturity: entry.maturity })));
              setEditing(true);
            }}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Edit Stack
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3 p-4">
          {items.map((item, index) => (
            <div
              key={`${item.category}-${item.technology}-${index}`}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
            >
              <span className="text-xs text-zinc-400">
                <span className="uppercase text-zinc-500">{item.category}</span> · {item.technology}{" "}
                <span className="text-zinc-600">({item.maturity})</span>
              </span>
              <button
                onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== index))}
                className="text-xs text-zinc-600 hover:text-rose-400 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value as StackCategory)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
            >
              {(["frontend", "backend", "database", "infra", "tooling", "other"] as StackCategory[]).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              placeholder="Technology"
              className="min-w-[100px] flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
            />
            <select
              value={newMat}
              onChange={(e) => setNewMat(e.target.value as StackMaturity)}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:border-zinc-600 focus:outline-none"
            >
              <option value="in-use">In Use</option>
              <option value="planned">Planned</option>
              <option value="deprecated">Deprecated</option>
            </select>
            <button
              type="button"
              onClick={addItem}
              className="rounded-lg bg-zinc-800 px-2 py-1.5 text-xs text-white hover:bg-zinc-700 transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Stack"}
            </button>
          </div>
        </div>
      ) : (
        <TechStackPanel stack={stack} />
      )}
    </section>
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
    <section>
      <SectionHeader
        title="Repositories"
        count={repos.length}
        action={
          <Link
            href={`/spaces/${spaceId}/repos`}
            className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
          >
            Open repos →
          </Link>
        }
      />

      {repos.length === 0 ? (
        <EmptyState
          icon={<CogIcon className="w-10 h-10" />}
          title="No repositories yet"
          description="Create and manage private code repos from the space repos page."
        />
      ) : (
        <div className="divide-y divide-zinc-800/50">
          {repos.map((repo) => (
            <Link
              key={repo.id}
              href={`/spaces/${spaceId}/repos/${repo.id}/settings`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-900/30 transition-colors"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{repo.name}</p>
                <p className="truncate text-xs text-zinc-500">
                  {repo.description || "No description"} · {repo.default_branch}
                </p>
              </div>
              <span className="text-xs text-zinc-400">Settings</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
