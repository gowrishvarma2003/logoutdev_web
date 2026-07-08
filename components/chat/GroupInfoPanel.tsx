"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import {
  CogIcon,
  LogOutIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  XIcon,
} from "@/components/ui/Icons";
import type { ChatConversation, ChatGroupMember, ChatUser } from "@/lib/types";
import {
  addGroupMembers,
  createGroupInvites,
  deleteGroup,
  listGroupMembers,
  transferGroupOwnership,
  updateGroup,
} from "@/lib/services/groupApi";
import { searchChatUsers } from "@/lib/services/chatApi";
import { shareStoredConversationKeys, wrapGroupKeyForMembers } from "@/lib/chatCrypto";

interface Props {
  conversation: ChatConversation;
  currentUserId: string;
  onClose: () => void;
  onLeftOrDeleted: () => void;
  onChanged: () => void;
}

export default function GroupInfoPanel({ conversation, currentUserId, onClose, onLeftOrDeleted, onChanged }: Props) {
  const group = conversation.group;
  const [members, setMembers] = useState<ChatGroupMember[]>([]);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(group?.title || "");
  const [description, setDescription] = useState(group?.description || "");
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatUser[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const myRole = useMemo(() => members.find((member) => member.user_id === currentUserId)?.role, [members, currentUserId]);
  const isOwner = myRole === "owner";
  const canManage = myRole === "owner" || myRole === "admin";
  const canEditInfo = isOwner || group?.who_can_edit_group_info === "all_members";

  const loadMembers = async () => {
    try {
      const data = await listGroupMembers(conversation.id);
      setMembers(data.members);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchChatUsers(query);
        setResults(data.users);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  async function saveInfo() {
    setBusy(true);
    setError("");
    try {
      await updateGroup(conversation.id, { title: title.trim(), description: description.trim() || null });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update group");
    } finally {
      setBusy(false);
    }
  }

  async function addMember(user: ChatUser) {
    setBusy(true);
    setError("");
    try {
      await addGroupMembers(conversation.id, { member_user_ids: [user.id], epoch_envelopes: [] });
      await shareStoredConversationKeys(conversation.id, [user.id]);
      setQuery("");
      setResults([]);
      await loadMembers();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setBusy(false);
    }
  }

  async function invite(user: ChatUser) {
    setBusy(true);
    setError("");
    try {
      await createGroupInvites(conversation.id, [user.id]);
      setQuery("");
      setResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(member: ChatGroupMember) {
    setBusy(true);
    setError("");
    try {
      const remaining = members.filter((item) => item.user_id !== member.user_id).map((item) => item.user_id);
      const { envelopes } = await wrapGroupKeyForMembers(conversation.id, 0, remaining);
      const { removeGroupMember: removeFn } = await import("@/lib/services/groupApi");
      await removeFn(conversation.id, member.user_id, envelopes);
      await loadMembers();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(member: ChatGroupMember, role: "admin" | "member") {
    setBusy(true);
    setError("");
    try {
      const { updateGroupMemberRole } = await import("@/lib/services/groupApi");
      await updateGroupMemberRole(conversation.id, member.user_id, role);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setBusy(false);
    }
  }

  async function transferOwnership(member: ChatGroupMember) {
    if (!confirm(`Transfer ownership to @${member.user?.username || member.user_id}? You will become an admin.`)) return;
    setBusy(true);
    setError("");
    try {
      await transferGroupOwnership(conversation.id, member.user_id);
      await loadMembers();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to transfer ownership");
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    if (!confirm("Leave this group? You will stop receiving messages.")) return;
    setBusy(true);
    setError("");
    try {
      const remaining = members.filter((item) => item.user_id !== currentUserId).map((item) => item.user_id);
      const { envelopes } = await wrapGroupKeyForMembers(conversation.id, 0, remaining);
      const { leaveGroup } = await import("@/lib/services/groupApi");
      await leaveGroup(conversation.id, envelopes);
      onLeftOrDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave group");
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    if (!confirm("Delete this group for everyone? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      await deleteGroup(conversation.id);
      onLeftOrDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete group");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="flex h-full w-full flex-col bg-app text-text-primary fixed inset-0 z-50 lg:static lg:z-0 lg:w-[360px] lg:border-l lg:border-border-subtle">
      <header className="flex items-center justify-between border-b border-border-subtle px-4 py-4">
        <div className="flex items-center gap-2">
          <CogIcon className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Group info</h2>
        </div>
        <button onClick={onClose} className="rounded-full p-1 text-text-muted hover:text-text-primary">
          <XIcon className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center border-b border-border-subtle px-4 py-6 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-surface-hover text-2xl font-semibold text-text-primary">
            {group?.title?.[0]?.toUpperCase() || "G"}
          </div>
          {editing ? (
            <div className="mt-3 w-full space-y-2 text-left">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
                className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-center text-sm"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                maxLength={500}
                className="w-full resize-none rounded-lg border border-border-default bg-surface px-3 py-2 text-sm"
              />
              <div className="flex justify-center gap-2">
                <button onClick={() => setEditing(false)} className="rounded-lg border border-border-default px-3 py-1.5 text-xs">Cancel</button>
                <button onClick={saveInfo} disabled={busy} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Save</button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="mt-3 text-lg font-semibold">{group?.title}</h3>
              {group?.description ? <p className="mt-1 text-sm text-text-muted">{group.description}</p> : null}
              <p className="mt-1 text-xs text-text-disabled">{members.length} members · epoch {group?.current_epoch_number}</p>
              {canEditInfo ? (
                <button onClick={() => setEditing(true)} className="mt-3 rounded-lg border border-border-default px-3 py-1.5 text-xs">
                  Edit group
                </button>
              ) : null}
            </>
          )}
        </div>

        <div className="border-b border-border-subtle px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-text-disabled">Members ({members.length})</h4>
            {canManage ? (
              <button onClick={() => setAdding((value) => !value)} className="flex items-center gap-1 text-xs text-emerald-400">
                <PlusIcon className="h-3.5 w-3.5" /> Add
              </button>
            ) : null}
          </div>

          {adding ? (
            <div className="mb-3">
              <div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-2">
                <SearchIcon className="h-4 w-4 text-text-disabled" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search username to add or invite"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <div className="mt-2 max-h-48 overflow-y-auto">
                {results.map((user) => {
                  const already = members.some((member) => member.user_id === user.id);
                  return (
                    <div key={user.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface">
                      <Avatar user={{ id: user.id, name: user.name || user.username || "User", avatar_url: user.avatar_url }} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">@{user.username}</span>
                        <span className="block truncate text-xs text-text-disabled">{user.headline || user.name}</span>
                      </span>
                      <button
                        onClick={() => (already ? invite(user) : addMember(user))}
                        disabled={busy}
                        className="rounded-lg border border-border-default px-2 py-1 text-xs"
                      >
                        {already ? "Invite" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            {members.map((member) => {
              const isMe = member.user_id === currentUserId;
              return (
                <div key={member.user_id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface">
                  <Avatar user={{ id: member.user_id, name: member.user?.name || member.user?.username || "User", avatar_url: member.user?.avatar_url }} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      @{member.user?.username || member.user?.name}
                      {isMe ? <span className="ml-2 text-xs text-text-disabled">(you)</span> : null}
                    </span>
                    <span className="text-xs capitalize text-text-disabled">{member.role}</span>
                  </span>
                  {canManage && !isMe && member.role !== "owner" ? (
                    <div className="flex gap-1">
                      {isOwner ? (
                        <button onClick={() => changeRole(member, member.role === "admin" ? "member" : "admin")} className="rounded px-2 py-1 text-xs text-text-muted hover:text-text-primary">
                          {member.role === "admin" ? "Demote" : "Promote"}
                        </button>
                      ) : null}
                      <button onClick={() => removeMember(member)} className="rounded px-2 py-1 text-xs text-rose-400 hover:text-rose-300">
                        Remove
                      </button>
                    </div>
                  ) : null}
                  {isOwner && !isMe ? (
                    <button onClick={() => transferOwnership(member)} className="rounded px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300">
                      Make owner
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-4">
          {myRole !== "owner" ? (
            <button
              onClick={leave}
              disabled={busy}
              className="flex w-full items-center gap-2 rounded-lg border border-border-default px-3 py-2 text-sm text-rose-300 hover:bg-rose-950/40"
            >
              <LogOutIcon className="h-4 w-4" /> Leave group
            </button>
          ) : (
            <button
              onClick={destroy}
              disabled={busy}
              className="flex w-full items-center gap-2 rounded-lg border border-rose-900 px-3 py-2 text-sm text-rose-300 hover:bg-rose-950/40"
            >
              <TrashIcon className="h-4 w-4" /> Delete group
            </button>
          )}
          {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
        </div>
      </div>
    </aside>
  );
}
