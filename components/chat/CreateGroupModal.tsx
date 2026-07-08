"use client";

import { useEffect, useMemo, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { CheckIcon, PlusIcon, SearchIcon, XIcon } from "@/components/ui/Icons";
import { searchChatUsers } from "@/lib/services/chatApi";
import type { ChatUser } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { title: string; description?: string | null; member_user_ids: string[] }) => Promise<void>;
  busy?: boolean;
}

export default function CreateGroupModal({ open, onClose, onCreate, busy }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatUser[]>([]);
  const [selected, setSelected] = useState<ChatUser[]>([]);
  const [error, setError] = useState("");
  const selectedIds = useMemo(() => new Set(selected.map((user) => user.id)), [selected]);
  const searchTerm = query.trim();
  const visibleResults = searchTerm.length >= 2 ? results : [];

  useEffect(() => {
    let cancelled = false;
    if (!open || searchTerm.length < 2) return;
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchChatUsers(searchTerm);
        if (!cancelled) {
          setResults(data.users);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, searchTerm]);

  if (!open) return null;

  function toggle(user: ChatUser) {
    setSelected((prev) =>
      prev.some((item) => item.id === user.id)
        ? prev.filter((item) => item.id !== user.id)
        : [...prev, user]
    );
  }

  async function submit() {
    setError("");
    if (!title.trim()) {
      setError("Enter a group name.");
      return;
    }
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim() || null,
        member_user_ids: selected.map((user) => user.id),
      });
      setTitle("");
      setDescription("");
      setSelected([]);
      setResults([]);
      setQuery("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border-default bg-app p-5 text-text-primary shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">New group</h2>
          <button onClick={onClose} className="rounded-full p-1 text-text-muted hover:text-text-primary">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-disabled">Group name</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              placeholder="My private group"
              className="mt-1 w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm outline-none focus:border-border-strong"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-disabled">Description (optional)</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              rows={2}
              placeholder="What is this group about?"
              className="mt-1 w-full resize-none rounded-lg border border-border-default bg-surface px-3 py-2 text-sm outline-none focus:border-border-strong"
            />
          </label>
        </div>

        {selected.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.map((user) => (
              <button
                key={user.id}
                onClick={() => toggle(user)}
                className="flex items-center gap-2 rounded-full border border-border-default bg-surface px-2 py-1 text-xs"
              >
                <Avatar user={{ id: user.id, name: user.name || user.username || "User", avatar_url: user.avatar_url }} size="xs" />
                <span>@{user.username || user.name}</span>
                <XIcon className="h-3 w-3 text-text-disabled" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4">
          <div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface px-3 py-2">
            <SearchIcon className="h-4 w-4 text-text-disabled" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Add members by username"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <div className="mt-2 max-h-64 overflow-y-auto">
            {visibleResults.map((user) => (
              <button
                key={user.id}
                onClick={() => toggle(user)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface"
              >
                <Avatar user={{ id: user.id, name: user.name || user.username || "User", avatar_url: user.avatar_url }} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">@{user.username}</span>
                  <span className="block truncate text-xs text-text-disabled">{user.headline || user.name}</span>
                </span>
                {selectedIds.has(user.id) ? <CheckIcon className="h-4 w-4 text-emerald-400" /> : <PlusIcon className="h-4 w-4 text-text-disabled" />}
              </button>
            ))}
            {!visibleResults.length && searchTerm.length >= 2 ? <p className="p-3 text-sm text-text-disabled">No users found.</p> : null}
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border-default px-4 py-2 text-sm">Cancel</button>
          <button
            onClick={submit}
            disabled={busy || !title.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            Create group
          </button>
        </div>
      </div>
    </div>
  );
}
