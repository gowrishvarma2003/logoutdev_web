"use client";

import { use, useState, useEffect } from "react";
import { useSpace, useJoinRequests, useStack } from "@/lib/hooks/useSpaces";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
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

/**
 * /spaces/[spaceId]/manage — Owner management dashboard.
 * Sections: Project Settings, Join Requests, Stack Management.
 */
export default function ManagePage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { space, refetch: refetchSpace } = useSpace(spaceId);
  const {
    requests,
    loading: reqLoading,
    refetch: refetchReqs,
  } = useJoinRequests(spaceId, "pending");
  const { stack, refetch: refetchStack } = useStack(spaceId);

  // Protect: only owner can see this page
  if (space && space.owner_id !== user?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">Access Denied</h2>
        <p className="text-sm text-zinc-500">Only the project owner can manage this space.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {/* ── Section 1: Project Settings ───────────────────────────────────── */}
      <ProjectSettingsSection space={space} refetch={refetchSpace} onDelete={() => router.push("/spaces")} />

      {/* ── Section 2: Pending Join Requests ──────────────────────────────── */}
      <JoinRequestsSection
        spaceId={spaceId}
        requests={requests}
        loading={reqLoading}
        refetch={refetchReqs}
      />

      {/* ── Section 3: Stack Management ───────────────────────────────────── */}
      <StackManagementSection spaceId={spaceId} stack={stack} refetch={refetchStack} />
    </div>
  );
}

// ─── Project Settings ────────────────────────────────────────────────────────

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

  // Re-sync state when space data loads asynchronously
  useEffect(() => {
    if (space) {
      setName(space.name);
      setSummary(space.summary);
      setDescription(space.description ?? "");
      setStatus(space.status);
      setVisibility(space.visibility);
      setRepoUrl(space.primary_repo_url ?? "");
    }
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
    } catch {
      // silently fail
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <CogIcon className="w-4 h-4" />
          Project Settings
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
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
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors"
          />
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={300}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-600 transition-colors"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-zinc-600 resize-none transition-colors"
          />
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="Repository URL"
            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          <div className="flex gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SpaceStatus)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-600"
            >
              {["idea", "building", "shipping", "paused", "archived"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as SpaceVisibility)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-600"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm text-zinc-400">
          <p><span className="text-zinc-500">Name:</span> <span className="text-white">{space.name}</span></p>
          <p><span className="text-zinc-500">Summary:</span> {space.summary}</p>
          <p><span className="text-zinc-500">Status:</span> {space.status}</p>
          <p><span className="text-zinc-500">Visibility:</span> {space.visibility}</p>
          {space.primary_repo_url && <p><span className="text-zinc-500">Repo:</span> {space.primary_repo_url}</p>}
        </div>
      )}

      {/* Danger zone */}
      <div className="mt-6 pt-4 border-t border-zinc-800">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 rounded-lg text-xs text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 disabled:opacity-50 transition-colors"
        >
          {deleting ? "Archiving…" : "Archive Space"}
        </button>
      </div>
    </section>
  );
}

// ─── Join Requests ───────────────────────────────────────────────────────────

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

  async function handleAction(
    requestId: string,
    action: "accept" | "reject" | "need-info"
  ) {
    setActing(requestId);
    try {
      await api.reviewJoinRequest(spaceId, requestId, action);
      refetch();
    } catch {
      // silently fail
    } finally {
      setActing(null);
    }
  }

  return (
    <section>
      <SectionHeader
        title="Pending Join Requests"
        count={requests.length}
      />

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
          {requests.map((req) => (
            <div key={req.id} className="px-4 py-4">
              <div className="flex items-start gap-3">
                <Avatar user={req.applicant} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">
                      {req.applicant?.name ?? "Unknown"}
                    </p>
                    <span className="text-[11px] text-zinc-500">
                      {formatRelativeTime(req.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-300 mb-2">{req.message}</p>

                  {/* Skills */}
                  {req.skills && req.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {req.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-md bg-sky-500/10 text-[11px] text-sky-400 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Availability */}
                  {req.availability_hours && (
                    <p className="text-[11px] text-zinc-500 mb-2">
                      Available {req.availability_hours} hrs/week
                    </p>
                  )}

                  {/* Proof links */}
                  {req.proof_links && req.proof_links.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {req.proof_links.map((link, i) => (
                        <a
                          key={i}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-sky-400 hover:text-sky-300 underline"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req.id, "accept")}
                      disabled={acting === req.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "need-info")}
                      disabled={acting === req.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 text-xs font-semibold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
                    >
                      <ChatBubbleIcon className="w-3.5 h-3.5" />
                      Need Info
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "reject")}
                      disabled={acting === req.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                    >
                      <XCircleIcon className="w-3.5 h-3.5" />
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

// ─── Stack Management ────────────────────────────────────────────────────────

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
    stack.map((s) => ({ category: s.category, technology: s.technology, maturity: s.maturity }))
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
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-white">Tech Stack</h3>
        {!editing && (
          <button
            onClick={() => {
              setItems(stack.map((s) => ({ category: s.category, technology: s.technology, maturity: s.maturity })));
              setEditing(true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Edit Stack
          </button>
        )}
      </div>

      {editing ? (
        <div className="p-4 space-y-3">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800"
            >
              <span className="text-xs text-zinc-400">
                <span className="text-zinc-500 uppercase">{item.category}</span>{" "}
                · {item.technology}{" "}
                <span className="text-zinc-600">({item.maturity})</span>
              </span>
              <button
                onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                className="text-xs text-zinc-600 hover:text-rose-400 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="flex gap-2 flex-wrap">
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value as StackCategory)}
              className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-600"
            >
              {(["frontend", "backend", "database", "infra", "tooling", "other"] as StackCategory[]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              type="text"
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              placeholder="Technology"
              className="flex-1 min-w-[100px] px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
            />
            <select
              value={newMat}
              onChange={(e) => setNewMat(e.target.value as StackMaturity)}
              className="px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-600"
            >
              <option value="in-use">In Use</option>
              <option value="planned">Planned</option>
              <option value="deprecated">Deprecated</option>
            </select>
            <button
              type="button"
              onClick={addItem}
              className="px-2 py-1.5 rounded-lg bg-zinc-800 text-xs text-white hover:bg-zinc-700 transition-colors"
            >
              Add
            </button>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save Stack"}
            </button>
          </div>
        </div>
      ) : (
        <TechStackPanel stack={stack} />
      )}
    </section>
  );
}
