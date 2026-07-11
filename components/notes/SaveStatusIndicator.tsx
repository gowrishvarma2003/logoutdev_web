"use client";

import { ClockIcon, CheckCircleIcon, XCircleIcon } from "@/components/ui/Icons";
import Spinner from "@/components/ui/Spinner";
import { formatRelativeTime } from "@/lib/utils";
import type { NoteSaveStatus } from "@/lib/types";

interface SaveStatusIndicatorProps {
  status: NoteSaveStatus;
  lastSavedAt: string | null;
  onRetry?: () => void;
}

export default function SaveStatusIndicator({ status, lastSavedAt, onRetry }: SaveStatusIndicatorProps) {
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-text-disabled">
        <Spinner size="sm" /> Saving…
      </span>
    );
  }

  if (status === "error") {
    return (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 transition-colors hover:text-rose-300"
      >
        <XCircleIcon className="h-3.5 w-3.5" />
        Failed to save — Retry
      </button>
    );
  }

  if (status === "conflict") {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-300" role="status">
        Changes need review
      </span>
    );
  }

  if (status === "unsaved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
        <ClockIcon className="h-3.5 w-3.5" />
        Unsaved changes
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-text-disabled">
        <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500" />
        Saved{lastSavedAt ? ` · ${formatRelativeTime(lastSavedAt)}` : ""}
      </span>
    );
  }

  return null;
}
