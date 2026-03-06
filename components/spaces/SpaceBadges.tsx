"use client";

import type { SpaceStatus, SpaceVisibility } from "@/lib/types";
import { GlobeIcon, LockIcon } from "@/components/ui/Icons";

// ─── Status Badge ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<SpaceStatus, { bg: string; text: string; dot: string }> = {
  idea:     { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
  building: { bg: "bg-amber-500/10",  text: "text-amber-400",  dot: "bg-amber-400" },
  shipping: { bg: "bg-emerald-500/10",text: "text-emerald-400",dot: "bg-emerald-400" },
  paused:   { bg: "bg-zinc-500/10",   text: "text-zinc-400",   dot: "bg-zinc-500" },
  archived: { bg: "bg-zinc-800/50",   text: "text-zinc-500",   dot: "bg-zinc-600" },
};

export function StatusBadge({ status }: { status: SpaceStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.idea;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Visibility Badge ────────────────────────────────────────────────────────

export function VisibilityBadge({ visibility }: { visibility: SpaceVisibility }) {
  const isPublic = visibility === "public";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
        isPublic
          ? "bg-sky-500/10 text-sky-400"
          : "bg-orange-500/10 text-orange-400"
      }`}
    >
      {isPublic ? <GlobeIcon className="w-3 h-3" /> : <LockIcon className="w-3 h-3" />}
      {isPublic ? "Public" : "Private"}
    </span>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="text-zinc-600 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-zinc-300 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {count !== undefined && (
          <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}
