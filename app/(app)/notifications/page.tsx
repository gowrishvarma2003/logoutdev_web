"use client";

import Link from "next/link";
import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import { BellIcon, SparklesIcon } from "@/components/ui/Icons";
import {
  type NotificationItem,
  type SuggestedAction,
} from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import {
  type NotificationTab,
  useNotificationsInbox,
  useNotificationSummary,
} from "@/lib/hooks/useNotifications";

const TABS: Array<{ key: NotificationTab; label: string }> = [
  { key: "needs-action", label: "Needs action" },
  { key: "unread", label: "Unread" },
  { key: "all", label: "All" },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>("needs-action");
  const { summary } = useNotificationSummary();
  const {
    items,
    suggestedActions,
    nextCursor,
    loading,
    loadingMore,
    error,
    loadMore,
    markOneRead,
    markVisibleRead,
  } = useNotificationsInbox(activeTab);

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-[17px] font-bold text-white">Inbox</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {summary.unread_count} unread · {summary.needs_action_count} need action
            </p>
          </div>

          <button
            type="button"
            onClick={() => void markVisibleRead()}
            disabled={summary.unread_count === 0}
            className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Mark all as read
          </button>
        </div>

        <div className="flex border-t border-zinc-800">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              {activeTab === tab.key ? (
                <span className="absolute inset-x-[24%] bottom-0 h-[2px] rounded-full bg-white" />
              ) : null}
            </button>
          ))}
        </div>
      </header>

      {activeTab === "needs-action" && suggestedActions.length > 0 ? (
        <section className="border-b border-zinc-800 px-4 py-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            <SparklesIcon className="h-4 w-4" />
            Suggested actions
          </div>
          <div className="grid gap-3">
            {suggestedActions.map((action) => (
              <SuggestedActionCard key={`${action.type}:${action.primary_cta.href}`} action={action} />
            ))}
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <EmptyState
          icon={<BellIcon className="h-10 w-10" />}
          title="Could not load notifications"
          description={error}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="h-10 w-10" />}
          title="No notifications yet"
          description="Work updates, mentions, replies, and review requests will show up here."
        />
      ) : (
        <div>
          {items.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              onRead={() => void markOneRead(item.id)}
            />
          ))}

          {nextCursor ? (
            <div className="border-t border-zinc-800 px-4 py-4">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function SuggestedActionCard({ action }: { action: SuggestedAction }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">{action.title}</h2>
          <p className="mt-1 text-sm text-zinc-400">{action.description}</p>
          {action.entity_ref?.title ? (
            <p className="mt-2 text-xs text-zinc-500">{action.entity_ref.title}</p>
          ) : null}
        </div>
        <Link
          href={action.primary_cta.href}
          className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
        >
          {action.primary_cta.label}
        </Link>
      </div>
    </article>
  );
}

function NotificationRow({
  item,
  onRead,
}: {
  item: NotificationItem;
  onRead: () => void;
}) {
  const actor = item.actor ?? { id: "system", name: "System", email: "" };
  const content = (
    <div className="flex gap-3 px-4 py-4 transition-colors hover:bg-zinc-900/40">
      <div className="relative shrink-0">
        <Avatar user={actor} size="sm" />
        {!item.read_at ? (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-sky-400" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-zinc-200">
              <span className="font-semibold text-white">{actor.name}</span>{" "}
              <span>{item.preview_text || item.verb || "updated"}</span>{" "}
              <span className="font-medium text-white">{item.entity_ref.title}</span>
            </p>
            {item.secondary_entity_ref?.subtitle ? (
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                {item.secondary_entity_ref.subtitle}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xs text-zinc-500">{formatRelativeTime(item.created_at)}</p>
            {item.group_count > 1 ? (
              <p className="mt-1 text-[11px] text-zinc-600">+{item.group_count - 1} more</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  if (!item.can_open || !item.action_url) {
    return (
      <div className="border-b border-zinc-800/80 opacity-80">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={item.action_url}
      onClick={() => {
        if (!item.read_at) onRead();
      }}
      className="block border-b border-zinc-800/80"
    >
      {content}
    </Link>
  );
}
