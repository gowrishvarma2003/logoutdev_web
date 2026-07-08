"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import FollowButton from "@/components/profile/FollowButton";
import { getFollowers, getFollowing } from "@/lib/api";
import { XIcon } from "@/components/ui/Icons";
import EmptyState from "@/components/ui/EmptyState";
import type { FollowListUser } from "@/lib/types";

interface FollowListModalProps {
  userId: string;
  initialTab: "followers" | "following";
  open: boolean;
  onClose: () => void;
}

const PAGE_SIZE = 24;

export default function FollowListModal({
  userId,
  initialTab,
  open,
  onClose,
}: FollowListModalProps) {
  const [tab, setTab] = useState<"followers" | "following">(initialTab);
  const [items, setItems] = useState<FollowListUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  // Reset + load first page whenever tab or user changes
  useEffect(() => {
    if (!open) return;
    setItems([]);
    setTotal(0);
    setPage(1);
    setDone(false);
    setError(null);
  }, [open, userId, tab]);

  const loadPage = useCallback(async (which: "followers" | "following", p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = which === "followers"
        ? await getFollowers(userId, p, PAGE_SIZE)
        : await getFollowing(userId, p, PAGE_SIZE);
      const list: FollowListUser[] = which === "followers"
        ? ((res as { followers?: FollowListUser[] }).followers ?? [])
        : ((res as { following?: FollowListUser[] }).following ?? []);
      setTotal(res.total ?? 0);
      setItems((prev) => (p === 1 ? list : [...prev, ...list]));
      setDone(list.length < PAGE_SIZE);
    } catch {
      setError("Failed to load.");
      setDone(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial load when opening / switching tab
  useEffect(() => {
    if (!open) return;
    loadPage(tab, 1);
  }, [open, tab, loadPage]);

  // Esc to close + lock body scroll
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const hasMore = !done && items.length < total;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Followers"
    >
      <div
        className="w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl border border-border-default bg-app shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setTab("followers")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === "followers" ? "bg-surface-hover text-text-primary" : "text-text-disabled hover:text-text-secondary"
              }`}
            >
              Followers
            </button>
            <button
              type="button"
              onClick={() => setTab("following")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === "following" ? "bg-surface-hover text-text-primary" : "text-text-disabled hover:text-text-secondary"
              }`}
            >
              Following
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-text-disabled hover:bg-surface-hover hover:text-text-primary transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {error && items.length === 0 ? (
            <div className="py-12 text-center text-sm text-rose-400">{error}</div>
          ) : items.length === 0 && !loading ? (
            <div className="p-4">
              <EmptyState
                icon={<XIcon className="h-6 w-6" />}
                title={tab === "followers" ? "No followers yet" : "Not following anyone yet"}
                description={tab === "followers" ? "Followers will appear here as people discover this profile." : "Follow developers and builders to keep their work close."}
                tone="default"
                size="sm"
              />
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {items.map((user) => (
                <li key={user.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={`/profile/${user.username || user.id}`} onClick={onClose} className="min-w-0 flex-1 flex items-center gap-3 group">
                    <Avatar user={user} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate group-hover:text-sky-400 transition-colors">
                        {user.name}
                      </p>
                      {user.username ? (
                        <p className="text-xs text-text-disabled truncate">@{user.username}</p>
                      ) : null}
                      {user.headline ? (
                        <p className="text-xs text-text-disabled truncate mt-0.5">{user.headline}</p>
                      ) : null}
                    </div>
                  </Link>
                  <FollowButton userId={user.id} size="sm" isMe={false} />
                </li>
              ))}
            </ul>
          )}

          {loading ? (
            <div className="flex justify-center py-5">
              <Spinner size="md" />
            </div>
          ) : null}

          {!loading && hasMore ? (
            <div className="flex justify-center py-4">
              <button
                type="button"
                onClick={() => loadPage(tab, page + 1).then(() => setPage((p) => p + 1))}
                className="px-4 py-2 rounded-lg border border-border-strong text-sm text-text-secondary hover:border-zinc-500 hover:text-text-primary transition-colors"
              >
                Show more
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
