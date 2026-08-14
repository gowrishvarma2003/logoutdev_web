"use client";

import { useState } from "react";
import {
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { WebhookFormData } from "./WebhookForm";

export interface Webhook extends WebhookFormData {
  id: string;
  createdAt: Date;
  lastTriggeredAt?: Date;
  status: "active" | "disabled" | "failed";
}

interface WebhookCardProps {
  webhook: Webhook;
  onEdit: (webhook: Webhook) => void;
  onDelete: (webhookId: string) => void;
  onTest: (webhookId: string) => void;
  isTestLoading?: boolean;
  testLoadingId?: string;
}

export default function WebhookCard({
  webhook,
  onEdit,
  onDelete,
  onTest,
  isTestLoading = false,
  testLoadingId,
}: WebhookCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const maskUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname.substring(0, 20);
      return `https://${domain}${path}${path.length >= 20 ? "..." : ""}`;
    } catch {
      return url.substring(0, 30) + "...";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-400/10";
      case "disabled":
        return "text-yellow-400 bg-yellow-400/10";
      case "failed":
        return "text-red-400 bg-red-400/10";
      default:
        return "text-zinc-400 bg-zinc-400/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircleIcon className="w-4 h-4" />;
      case "disabled":
        return <ExclamationCircleIcon className="w-4 h-4" />;
      case "failed":
        return <ExclamationCircleIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "disabled":
        return "Disabled";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 hover:bg-zinc-900 transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <code className="text-xs font-mono text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded">
              {webhook.id}
            </code>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(webhook.status)}`}
            >
              {getStatusIcon(webhook.status)}
              {getStatusLabel(webhook.status)}
            </span>
          </div>
          <p className="text-sm text-zinc-300 font-mono break-all">
            {maskUrl(webhook.url)}
          </p>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Options"
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 z-50 rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg">
              <button
                onClick={() => {
                  onTest(webhook.id);
                  setShowMenu(false);
                }}
                disabled={isTestLoading && testLoadingId === webhook.id}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50 first:rounded-t-[5px]"
              >
                {isTestLoading && testLoadingId === webhook.id ? (
                  <>
                    <div className="w-3 h-3 border border-zinc-400 border-t-white rounded-full animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Test Webhook
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onEdit(webhook);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Edit
              </button>

              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors flex items-center gap-2 last:rounded-b-[5px]"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Events */}
      <div className="mb-4 pb-4 border-b border-zinc-800">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
          Events ({webhook.events.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {webhook.events.map((event) => (
            <span
              key={event}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400 border border-blue-900/50"
            >
              {event}
            </span>
          ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-zinc-600 mb-1">Created</p>
          <p className="text-zinc-300">{formatDate(webhook.createdAt)}</p>
        </div>
        <div>
          <p className="text-zinc-600 mb-1">Last Triggered</p>
          <p className="text-zinc-300">
            {webhook.lastTriggeredAt
              ? formatDate(webhook.lastTriggeredAt)
              : "Never"}
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete Webhook?
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              This action cannot be undone. The webhook at{" "}
              <code className="text-xs font-mono bg-zinc-800 px-1 rounded">
                {maskUrl(webhook.url)}
              </code>{" "}
              will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(webhook.id);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
