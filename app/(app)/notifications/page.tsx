"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import Avatar from "@/components/ui/Avatar";
import { EmptyState } from "@/components/spaces/SpaceBadges";
import {
  BellIcon,
  BoltIcon,
  ChatBubbleIcon,
  CheckIcon,
  ClockIcon,
  CodeBracketIcon,
  ExternalLinkIcon,
  FilterIcon,
  QuestionMarkCircleIcon,
  RocketIcon,
  SearchIcon,
  SparklesIcon,
} from "@/components/ui/Icons";
import {
  type EntityRef,
  type NotificationItem,
  type SuggestedAction,
} from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import {
  type NotificationTab,
  useNotificationsInbox,
  useNotificationSummary,
} from "@/lib/hooks/useNotifications";

type FilterState = "all" | "unread" | "action";

const MUTED_CATEGORIES_STORAGE_KEY = "logoutdev:notifications:muted-categories";

const TABS: Array<{
  key: NotificationTab;
  label: string;
  description: string;
}> = [
  { key: "priority", label: "Priority", description: "Action and important unread work" },
  { key: "mentions", label: "Mentions", description: "Replies, comments, and direct mentions" },
  { key: "work", label: "Work", description: "Spaces, repos, freelance, launches, and questions" },
  { key: "social", label: "Social", description: "Community activity and lightweight updates" },
  { key: "all", label: "All", description: "Complete notification history" },
];

const FILTERS: Array<{ key: FilterState; label: string }> = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "action", label: "Action" },
];

const CATEGORY_LABELS: Record<string, string> = {
  calls: "Calls",
  freelance: "Freelance",
  launch: "Launch",
  question: "Question",
  repo: "Repo",
  social: "Social",
  space: "Space",
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label }));

const PRIORITY_LABELS: Record<NotificationItem["priority"], string> = {
  action: "Action required",
  important: "Important",
  activity: "Activity",
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>("priority");
  const [filter, setFilter] = useState<FilterState>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mutedCategories, setMutedCategories] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(MUTED_CATEGORIES_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch {
      return [];
    }
  });
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

  const pendingItems = useMemo(
    () => items.filter((item) => item.priority === "action" && !item.read_at).slice(0, 4),
    [items]
  );

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      if (item.priority !== "action" && mutedCategories.includes(item.category)) return false;
      if (filter === "unread" && item.read_at) return false;
      if (filter === "action" && item.priority !== "action") return false;
      if (!normalizedQuery) return true;

      return [
        item.actor?.name,
        item.actor?.username,
        item.preview_text,
        item.event_type,
        item.category,
        item.entity_ref?.title,
        item.entity_ref?.subtitle,
        item.secondary_entity_ref?.title,
        item.secondary_entity_ref?.subtitle,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [filter, items, mutedCategories, query]);

  const selectedItem = useMemo(() => {
    if (!visibleItems.length) return null;
    return visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0];
  }, [selectedId, visibleItems]);

  async function handleMarkRead(item: NotificationItem) {
    if (!item.read_at) {
      await markOneRead(item.id);
    }
  }

  function toggleMutedCategory(category: string) {
    setMutedCategories((current) => {
      const next = current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MUTED_CATEGORIES_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }

  const latestLabel = summary.recent[0]?.created_at
    ? `${formatRelativeTime(summary.recent[0].created_at)} ago`
    : "No recent updates";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
        <div className="px-4 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/70 text-sky-300">
                  <BellIcon className="h-4 w-4" />
                </span>
                <div>
                  <h1 className="text-[18px] font-bold text-white">Notifications</h1>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {summary.needs_action_count} actions pending · {summary.unread_count} unread · {latestLabel}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void markVisibleRead()}
              disabled={summary.unread_count === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Mark visible read
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen((current) => !current)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
            >
              <FilterIcon className="h-3.5 w-3.5" />
              Preferences
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="Actions" value={summary.needs_action_count} tone="action" />
            <Metric label="Unread" value={summary.unread_count} tone="unread" />
            <Metric label="Recent" value={summary.recent.length} tone="recent" />
          </div>
        </div>

        <div className="flex overflow-x-auto border-t border-zinc-800 px-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              title={tab.description}
              onClick={() => {
                setActiveTab(tab.key);
                setFilter("all");
                setQuery("");
                setSelectedId(null);
              }}
              className={`relative min-w-fit px-3 py-3 text-sm font-semibold transition-colors sm:flex-1 ${
                activeTab === tab.key ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
              {activeTab === tab.key ? (
                <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-sky-300" />
              ) : null}
            </button>
          ))}
        </div>
      </header>

      {settingsOpen ? (
        <section className="border-b border-zinc-800 bg-zinc-950/70 px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Notification preferences</p>
              <p className="mt-1 text-xs text-zinc-500">Muted categories hide non-action updates on this device.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((category) => {
                const muted = mutedCategories.includes(category.key);
                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => toggleMutedCategory(category.key)}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      muted
                        ? "border-zinc-700 bg-zinc-900 text-zinc-500"
                        : "border-sky-400/30 bg-sky-400/10 text-sky-200"
                    }`}
                  >
                    {muted ? "Muted " : "On "}
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "priority" && (suggestedActions.length > 0 || pendingItems.length > 0) ? (
        <section className="border-b border-zinc-800 px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
              <SparklesIcon className="h-4 w-4 text-sky-300" />
              Needs attention
            </div>
            <span className="text-xs text-zinc-600">{pendingItems.length + suggestedActions.length} open</span>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {pendingItems.map((item) => (
              <ActionNotificationCard
                key={item.id}
                item={item}
                onRead={() => void handleMarkRead(item)}
                onSelect={() => setSelectedId(item.id)}
              />
            ))}
            {suggestedActions.map((action) => (
              <SuggestedActionCard key={`${action.type}:${action.primary_cta.href}`} action={action} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="border-b border-zinc-800 px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search actor, project, repo, question, or update"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </label>
          <div className="flex items-center gap-2 overflow-x-auto">
            <FilterIcon className="h-4 w-4 shrink-0 text-zinc-600" />
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                  filter === item.key
                    ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
                    : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <NotificationSkeleton />
      ) : error ? (
        <EmptyState
          icon={<BellIcon className="h-10 w-10" />}
          title="Could not load notifications"
          description={error}
        />
      ) : visibleItems.length === 0 ? (
        <EmptyState
          icon={<BellIcon className="h-10 w-10" />}
          title={getEmptyTitle(activeTab, filter, query)}
          description="Try another tab or clear the search to see more updates."
        />
      ) : (
        <div className="grid min-h-[520px] xl:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            {visibleItems.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                selected={selectedItem?.id === item.id}
                onSelect={() => setSelectedId(item.id)}
                onRead={() => void handleMarkRead(item)}
              />
            ))}

            {nextCursor ? (
              <div className="border-t border-zinc-800 px-4 py-4">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            ) : null}
          </div>

          <aside className="hidden border-l border-zinc-800 bg-zinc-950/70 xl:block">
            {selectedItem ? (
              <NotificationDetail item={selectedItem} onRead={() => void handleMarkRead(selectedItem)} />
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "action" | "unread" | "recent" }) {
  const toneClass = {
    action: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    unread: "border-sky-400/20 bg-sky-400/10 text-sky-200",
    recent: "border-zinc-700 bg-zinc-900/50 text-zinc-200",
  }[tone];

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <p className="text-lg font-bold leading-none">{value > 99 ? "99+" : value}</p>
      <p className="mt-1 text-[11px] font-medium text-zinc-500">{label}</p>
    </div>
  );
}

function SuggestedActionCard({ action }: { action: SuggestedAction }) {
  return (
    <article className="rounded-xl border border-sky-400/20 bg-sky-400/10 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{action.title}</p>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{action.description}</p>
          {action.entity_ref?.title ? (
            <EntityMeta entity={action.entity_ref} className="mt-3" />
          ) : null}
        </div>
        <Link
          href={action.primary_cta.href}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
        >
          {action.primary_cta.label}
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

function ActionNotificationCard({
  item,
  onRead,
  onSelect,
}: {
  item: NotificationItem;
  onRead: () => void;
  onSelect: () => void;
}) {
  const body = (
    <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 transition-colors hover:border-amber-300/30">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{buildNotificationSentence(item)}</p>
          <EntityMeta entity={item.entity_ref} className="mt-3" />
          {item.secondary_entity_ref?.subtitle ? (
            <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{item.secondary_entity_ref.subtitle}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-xs text-zinc-500">{formatRelativeTime(item.created_at)}</span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-amber-300 px-2.5 py-1 text-[11px] font-bold text-zinc-950">Action</span>
        {item.can_open && item.action_url ? (
          <span className="text-xs font-medium text-zinc-400">Open to resolve</span>
        ) : (
          <span className="text-xs font-medium text-zinc-500">Context only</span>
        )}
      </div>
    </div>
  );

  if (item.can_open && item.action_url) {
    return (
      <Link
        href={item.action_url}
        onClick={() => {
          onRead();
          onSelect();
        }}
      >
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onSelect} className="text-left">
      {body}
    </button>
  );
}

function NotificationRow({
  item,
  selected,
  onSelect,
  onRead,
}: {
  item: NotificationItem;
  selected: boolean;
  onSelect: () => void;
  onRead: () => void;
}) {
  const actor = item.actor ?? { id: "system", name: "System", email: "" };
  const unread = !item.read_at;

  return (
    <article
      className={`border-b border-zinc-800/80 transition-colors ${
        selected ? "bg-zinc-900/60" : "hover:bg-zinc-900/35"
      } ${unread ? "" : "opacity-80"}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
        className="block w-full px-4 py-4 text-left"
      >
        <div className="flex gap-3">
          <div className="relative shrink-0">
            <Avatar user={actor} size="sm" />
            <span className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-zinc-950 ${getCategoryTone(item.category)}`}>
              {getCategoryIcon(item.category)}
            </span>
            {unread ? (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-sky-400" />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm text-zinc-200">
                  <span className="font-semibold text-white">{buildActorName(item)}</span>{" "}
                  <span>{buildNotificationSentence(item, false)}</span>
                </p>
                <EntityMeta entity={item.entity_ref} className="mt-2" />
                {item.secondary_entity_ref?.subtitle ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">
                    {item.secondary_entity_ref.subtitle}
                  </p>
                ) : null}
              </div>

              <div className="shrink-0 text-right">
                <p className="text-xs text-zinc-500">{formatRelativeTime(item.created_at)}</p>
                {item.group_count > 1 ? (
                  <p className="mt-1 text-[11px] text-zinc-600">{item.group_count} updates</p>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PriorityBadge priority={item.priority} />
              <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                {CATEGORY_LABELS[item.category] ?? item.category}
              </span>
              {unread ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRead();
                  }}
                  className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
                >
                  Mark read
                </button>
              ) : null}
              {item.can_open && item.action_url ? (
                <Link
                  href={item.action_url}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRead();
                  }}
                  className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                >
                  Open
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function NotificationDetail({ item, onRead }: { item: NotificationItem; onRead: () => void }) {
  return (
    <div className="sticky top-[162px] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">Selected update</p>
          <h2 className="mt-1 text-base font-semibold text-white">{CATEGORY_LABELS[item.category] ?? item.category}</h2>
        </div>
        <PriorityBadge priority={item.priority} />
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="text-sm leading-relaxed text-zinc-200">{buildNotificationSentence(item)}</p>
        <p className="mt-2 text-xs text-zinc-500">{formatRelativeTime(item.created_at)} ago</p>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600">Context</p>
        <EntityMeta entity={item.entity_ref} className="mt-3" expanded />
        {item.secondary_entity_ref ? (
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <EntityMeta entity={item.secondary_entity_ref} expanded />
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2">
        {item.can_open && item.action_url ? (
          <Link
            href={item.action_url}
            onClick={onRead}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
          >
            Open notification
            <ExternalLinkIcon className="h-4 w-4" />
          </Link>
        ) : null}
        {!item.read_at ? (
          <button
            type="button"
            onClick={onRead}
            className="rounded-xl border border-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            Mark as read
          </button>
        ) : null}
      </div>
    </div>
  );
}

function EntityMeta({
  entity,
  className = "",
  expanded = false,
}: {
  entity?: EntityRef | null;
  className?: string;
  expanded?: boolean;
}) {
  if (!entity) return null;

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-zinc-500">
        <span className="shrink-0">{CATEGORY_LABELS[entity.type] ?? entity.type}</span>
        <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-700" />
        <span className="truncate text-zinc-300">{entity.title}</span>
      </div>
      {expanded && entity.subtitle ? (
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{entity.subtitle}</p>
      ) : null}
      {expanded && entity.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entity.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-500">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: NotificationItem["priority"] }) {
  const className = {
    action: "border-amber-300/30 bg-amber-300/10 text-amber-200",
    important: "border-sky-300/30 bg-sky-300/10 text-sky-200",
    activity: "border-zinc-800 bg-zinc-900/40 text-zinc-500",
  }[priority];

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function NotificationSkeleton() {
  return (
    <div>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-3 border-b border-zinc-800 px-4 py-4">
          <div className="h-9 w-9 rounded-full bg-zinc-900" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-3/4 rounded bg-zinc-900" />
            <div className="h-3 w-1/2 rounded bg-zinc-900" />
            <div className="flex gap-2">
              <div className="h-5 w-20 rounded-full bg-zinc-900" />
              <div className="h-5 w-16 rounded-full bg-zinc-900" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function buildActorName(item: NotificationItem) {
  return item.actor?.name || item.actor?.username || "System";
}

function buildNotificationSentence(item: NotificationItem, includeActor = true) {
  const actorPrefix = includeActor ? `${buildActorName(item)} ` : "";
  const action = item.preview_text || item.verb || eventTypeLabel(item.event_type);
  const entity = item.entity_ref?.title ? ` ${item.entity_ref.title}` : "";

  if (item.group_count > 1) {
    return `${actorPrefix}${item.group_count} updates: ${action}${entity}`;
  }

  return `${actorPrefix}${action}${entity}`;
}

function eventTypeLabel(eventType: string) {
  return eventType.replace(/_/g, " ");
}

function getCategoryTone(category: string) {
  if (category === "repo") return "bg-violet-500/20 text-violet-300";
  if (category === "space") return "bg-sky-500/20 text-sky-300";
  if (category === "freelance") return "bg-emerald-500/20 text-emerald-300";
  if (category === "question") return "bg-amber-500/20 text-amber-300";
  if (category === "launch") return "bg-fuchsia-500/20 text-fuchsia-300";
  if (category === "calls") return "bg-rose-500/20 text-rose-300";
  return "bg-zinc-800 text-zinc-400";
}

function getCategoryIcon(category: string): ReactNode {
  const className = "h-3 w-3";
  if (category === "repo") return <CodeBracketIcon className={className} />;
  if (category === "space") return <RocketIcon className={className} />;
  if (category === "freelance") return <BoltIcon className={className} />;
  if (category === "question") return <QuestionMarkCircleIcon className={className} />;
  if (category === "launch") return <SparklesIcon className={className} />;
  if (category === "calls") return <ClockIcon className={className} />;
  return <ChatBubbleIcon className={className} />;
}

function getEmptyTitle(tab: NotificationTab, filter: FilterState, query: string) {
  if (query.trim()) return "No matching notifications";
  if (filter === "unread") return "No unread notifications";
  if (filter === "action") return "Nothing needs action";
  if (tab === "priority") return "Nothing needs your attention";
  if (tab === "mentions") return "No mentions yet";
  if (tab === "work") return "No work updates yet";
  if (tab === "social") return "No social updates yet";
  return "You are all caught up";
}
