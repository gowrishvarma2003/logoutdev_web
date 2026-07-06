"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { ArrowLeftIcon, ChatBubbleIcon, CheckCircleIcon, DotsIcon, FolderIcon, LockIcon, PinIcon, PinSlashIcon, PlusIcon, UsersIcon, XCircleIcon } from "@/components/ui/Icons";
import { useAuth } from "@/lib/hooks/useAuth";
import { useChatSocket } from "@/lib/hooks/useChatSocket";
import { useGroupChat } from "@/lib/hooks/useGroupChat";
import type { ChatConversation, ChatGroupInvite, ChatMessage, ChatMessageRequest, ChatSettings, ChatUser } from "@/lib/types";
import {
  createDirectConversation,
  completeEncryptedAttachment,
  fetchUserCryptoProfile,
  getChatConversation,
  getChatSettings,
  listChatConversations,
  listChatMessages,
  listMessageRequests,
  markChatRead,
  respondMessageRequest,
  searchChatUsers,
  sendEncryptedChatMessage,
  updateChatConversationPin,
  updateChatSettings,
  updateChatUsername,
  uploadEncryptedAttachmentBlob,
} from "@/lib/services/chatApi";
import {
  createGroup,
  listGroupInvites,
  respondGroupInvite,
} from "@/lib/services/groupApi";
import {
  decryptChatMessage,
  decryptAttachment,
  decryptGroupMessage,
  encryptAttachment,
  encryptChatMessage,
  getStoredVault,
  setupEncryptedChat,
  restoreEncryptedChat,
  resetEncryptedChat,
  syncConversationKeys,
  shareConversationKey,
} from "@/lib/chatCrypto";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import GroupInfoPanel from "@/components/chat/GroupInfoPanel";
import { CallErrorBoundary, CallProvider, ConversationCallControls, OngoingGroupCallBanner } from "@/components/calls/CallProvider";
import EmptyState from "@/components/ui/EmptyState";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { PhoneIcon, VideoCameraIcon, PhoneArrowDownLeftIcon } from "@heroicons/react/24/outline";

type ViewMode = "inbox" | "requests" | "group-invites" | "settings";

function resolveAttachmentDownloadUrl(downloadUrl: string) {
  return downloadUrl.startsWith("/") ? `${API_BASE_URL}${downloadUrl}` : downloadUrl;
}

type PendingAttachment = {
  id: string;
  file: File;
  status: "local" | "uploading" | "ready" | "failed";
  progress: number;
  attachmentId?: string;
  encryptedMetadata?: string;
  error?: string;
};

type AttachmentView = {
  url: string;
  name: string;
  type: string;
  size: number;
};

function formatTime(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatLastSeen(user?: ChatUser | null) {
  if (!user) return "";
  if (user.presence_status === "online") return "online";
  if (!user.last_seen_visible) return "last seen hidden";
  if (!user.last_seen_at) return "last seen recently";
  return `last seen ${formatTime(user.last_seen_at)}`;
}

function profileHref(user?: ChatUser | null) {
  if (!user) return "/profile";
  return `/profile/${user.username || user.id}`;
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function previewTextFromMessage(message: ChatMessage | null | undefined, currentUserId?: string) {
  if (!message) return "";
  if (message.deleted_for_everyone_at) return "Message deleted";

  if (message.message_type === "system" && message.decrypted_body) {
    try {
      if (message.decrypted_body.startsWith("{")) {
        const callLog = JSON.parse(message.decrypted_body);
        if (callLog.type === "call_log") {
          const isCaller = currentUserId ? callLog.created_by === currentUserId : false;
          const isVideo = callLog.call_type.includes("video");
          const isGroup = callLog.call_mode === "group";

          const formatDuration = (seconds?: number | null) => {
            if (!seconds) return "";
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            if (h > 0) return `${h}h ${m}m ${s}s`;
            if (m > 0) return `${m}m ${s}s`;
            return `${s}s`;
          };

          if (isGroup) {
            if (callLog.status === "ongoing") {
              return `Group ${isVideo ? "video" : "audio"} call started`;
            } else {
              const durationStr = callLog.duration_seconds ? ` (${formatDuration(callLog.duration_seconds)})` : "";
              return `Group ${isVideo ? "video" : "audio"} call ended${durationStr}`;
            }
          } else {
            if (callLog.status === "missed") {
              return isCaller ? `Unanswered ${isVideo ? "video" : "audio"} call` : `Missed ${isVideo ? "video" : "audio"} call`;
            } else if (callLog.status === "rejected") {
              return isCaller ? `${isVideo ? "Video" : "Audio"} call declined` : `Declined ${isVideo ? "video" : "audio"} call`;
            } else if (callLog.status === "cancelled") {
              return isCaller ? `Cancelled ${isVideo ? "video" : "audio"} call` : `Missed ${isVideo ? "video" : "audio"} call`;
            } else if (callLog.status === "failed") {
              return `Failed ${isVideo ? "video" : "audio"} call`;
            } else if (callLog.status === "ended") {
              if (callLog.duration_seconds && callLog.duration_seconds > 0) {
                return `${isVideo ? "Video" : "Audio"} call ended (${formatDuration(callLog.duration_seconds)})`;
              } else {
                return `${isVideo ? "Video" : "Audio"} call (no answer)`;
              }
            } else {
              return `${isVideo ? "Video" : "Audio"} call`;
            }
          }
        }
      }
    } catch {
      // Ignore: fall back to raw message body
    }
  }

  if (message.decrypted_body) return message.decrypted_body;
  if (message.missing_envelope) return "Message not available on this device";
  if (message.decrypt_failed) return "Could not decrypt message";
  return "Encrypted message";
}

async function decryptConversationPreview(conversation: ChatConversation, currentUserId?: string) {
  if (!conversation.last_message) return "";
  const decrypted = conversation.type === "group"
    ? await decryptGroupMessage(conversation.last_message)
    : await decryptChatMessage(conversation.last_message);
  return previewTextFromMessage(decrypted, currentUserId);
}

function ConversationRow({
  conversation,
  active,
  preview,
  onSelect,
  onTogglePin,
}: {
  conversation: ChatConversation;
  active: boolean;
  preview?: string;
  onSelect: () => void;
  onTogglePin: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isGroup = conversation.type === "group";
  const other = conversation.other_user;
  const title = isGroup ? conversation.group?.title || "Private group" : other?.username ? `@${other.username}` : other?.name || "Unknown user";
  return (
    <div
      className={`flex w-full items-center gap-2 border-b border-zinc-900 px-3 py-2 transition-colors ${
        active ? "bg-zinc-900" : "hover:bg-zinc-900/60"
      }`}
    >
      <button onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-1 text-left">
        {isGroup ? (
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
            {conversation.group?.title?.[0]?.toUpperCase() || <UsersIcon className="h-4 w-4" />}
          </div>
        ) : (
          <Avatar user={other ? { id: other.id, name: other.name || other.username || "User", avatar_url: other.avatar_url } : null} size="md" />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1 truncate text-sm font-semibold text-white">
              {isGroup ? <LockIcon className="h-3 w-3 shrink-0 text-emerald-400" /> : null}
              <span className="truncate">{title}</span>
            </span>
            <span className="flex items-center gap-1.5 shrink-0 text-[11px] text-zinc-500">
              {conversation.pinned_at && (
                <PinIcon className="h-3 w-3 text-emerald-400 shrink-0" />
              )}
              {formatTime(conversation.last_message_at || conversation.updated_at)}
            </span>
          </span>
          <span className="mt-1 block truncate text-xs text-zinc-500">
            {preview || (conversation.last_message_id ? "Message not available on this device" : "No messages yet")}
          </span>
        </span>
      </button>
      {conversation.unread_count > 0 ? (
        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-zinc-950">
          {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
        </span>
      ) : null}

      {/* Options Dropdown Menu */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-zinc-200 transition-colors"
          title="Options"
          aria-label="Options"
        >
          <DotsIcon className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-30 cursor-default"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
              }}
            />
            <div className="absolute right-0 mt-1.5 w-32 z-40 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 py-1 shadow-2xl">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white transition-colors"
              >
                {conversation.pinned_at ? (
                  <>
                    <PinSlashIcon className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Unpin chat</span>
                  </>
                ) : (
                  <>
                    <PinIcon className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Pin chat</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  currentUserId,
  senderLabel,
  showSender,
  attachmentViews,
  onRetry,
}: {
  message: ChatMessage;
  currentUserId: string;
  senderLabel?: string;
  showSender?: boolean;
  attachmentViews?: Record<string, AttachmentView>;
  onRetry?: (message: ChatMessage) => void;
}) {
  const own = message.sender_id === currentUserId;
  const attachments = message.attachments || [];

  if (message.message_type === "system") {
    let callLog: {
      type?: string;
      call_id: string;
      call_type: string;
      call_mode: string;
      status: string;
      created_by: string;
      duration_seconds?: number | null;
      end_reason?: string | null;
    } | null = null;

    try {
      if (message.decrypted_body && message.decrypted_body.startsWith("{")) {
        callLog = JSON.parse(message.decrypted_body);
      }
    } catch {
      // Ignored
    }

    if (callLog && callLog.type === "call_log") {
      const isCaller = callLog.created_by === currentUserId;
      const isVideo = callLog.call_type.includes("video");
      const isGroup = callLog.call_mode === "group";

      const formatDuration = (seconds?: number | null) => {
        if (!seconds) return "";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
      };

      let text = "";
      let iconColor = "text-zinc-400";
      let IconComponent = PhoneIcon;

      if (isVideo) {
        IconComponent = VideoCameraIcon;
      }

      if (isGroup) {
        if (callLog.status === "ongoing") {
          text = `Group ${isVideo ? "video" : "audio"} call started`;
          iconColor = "text-emerald-400 animate-pulse";
        } else {
          const durationStr = callLog.duration_seconds ? ` (${formatDuration(callLog.duration_seconds)})` : "";
          text = `Group ${isVideo ? "video" : "audio"} call ended${durationStr}`;
          iconColor = "text-zinc-500";
        }
      } else {
        if (callLog.status === "missed") {
          text = isCaller ? `Unanswered ${isVideo ? "video" : "audio"} call` : `Missed ${isVideo ? "video" : "audio"} call`;
          iconColor = isCaller ? "text-zinc-500" : "text-rose-400";
          if (!isCaller) IconComponent = PhoneArrowDownLeftIcon;
        } else if (callLog.status === "rejected") {
          text = isCaller ? `${isVideo ? "Video" : "Audio"} call declined` : `Declined ${isVideo ? "video" : "audio"} call`;
          iconColor = "text-zinc-500";
        } else if (callLog.status === "cancelled") {
          text = isCaller ? `Cancelled ${isVideo ? "video" : "audio"} call` : `Missed ${isVideo ? "video" : "audio"} call`;
          iconColor = isCaller ? "text-zinc-500" : "text-rose-400";
          if (!isCaller) IconComponent = PhoneArrowDownLeftIcon;
        } else if (callLog.status === "failed") {
          text = `Failed ${isVideo ? "video" : "audio"} call`;
          iconColor = "text-rose-400";
        } else if (callLog.status === "ended") {
          if (callLog.duration_seconds && callLog.duration_seconds > 0) {
            text = `${isVideo ? "Video" : "Audio"} call ended (${formatDuration(callLog.duration_seconds)})`;
            iconColor = "text-emerald-400";
          } else {
            text = `${isVideo ? "Video" : "Audio"} call (no answer)`;
            iconColor = "text-zinc-500";
          }
        } else {
          text = `${isVideo ? "Video" : "Audio"} call`;
        }
      }

      return (
        <div className="flex justify-center my-3 animate-chat-fade-in w-full">
          <div className="flex items-center gap-2 rounded-full bg-zinc-900/60 border border-zinc-800/80 px-4 py-1.5 text-xs text-zinc-300 shadow-sm backdrop-blur-sm">
            <IconComponent className={`h-3.5 w-3.5 ${iconColor}`} />
            <span>{text}</span>
            <span className="text-[10px] text-zinc-500 ml-1">{formatTime(message.created_at)}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center my-2 animate-chat-fade-in w-full">
        <div className="rounded-full bg-zinc-900/40 border border-zinc-800/50 px-3 py-1 text-xs text-zinc-400">
          {message.decrypted_body}
        </div>
      </div>
    );
  }
  return (
    <div className={`flex ${own ? "justify-end" : "justify-start"} animate-chat-fade-in`}>
      <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${own ? "bg-white text-zinc-950" : "bg-zinc-900 text-zinc-100"}`}>
        {showSender && !own ? (
          <span className="mb-0.5 block text-[11px] font-semibold text-emerald-300">{senderLabel || "Member"}</span>
        ) : null}
        {attachments.length ? (
          <div className="mb-2 space-y-2">
            {attachments.map((attachment) => {
              const view = attachmentViews?.[attachment.id];
              if (view?.type.startsWith("image/")) {
                return (
                  <a key={attachment.id} href={view.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={view.url} alt={view.name} className="max-h-72 w-full object-cover" />
                  </a>
                );
              }
              return (
                <a
                  key={attachment.id}
                  href={view?.url || attachment.download_url || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left ${
                    own ? "border-zinc-300 bg-zinc-100 text-zinc-900" : "border-zinc-800 bg-zinc-950 text-zinc-100"
                  }`}
                >
                  <FolderIcon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{view?.name || "Encrypted attachment"}</span>
                    <span className={own ? "block text-[11px] text-zinc-500" : "block text-[11px] text-zinc-500"}>
                      {view ? formatFileSize(view.size) : "Decrypting..."}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        ) : null}
        {message.deleted_for_everyone_at ? (
          <span className="text-zinc-500">Message deleted</span>
        ) : message.missing_envelope ? (
          <span className={own ? "text-zinc-600" : "text-zinc-500"}>Message not available on this device</span>
        ) : message.decrypt_failed ? (
          <span className={own ? "text-zinc-600" : "text-zinc-500"}>Could not decrypt this message</span>
        ) : (
          <span className="whitespace-pre-wrap break-words">{message.decrypted_body || (attachments.length ? "" : "Encrypted message")}</span>
        )}
        <span className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${own ? "text-zinc-500" : "text-zinc-600"}`}>
          {message.failed ? (
            <>
              <span className={own ? "text-rose-700" : "text-rose-400"}>Not sent</span>
              {onRetry ? (
                <button type="button" onClick={() => onRetry(message)} className="font-semibold underline underline-offset-2">
                  Retry
                </button>
              ) : null}
            </>
          ) : message.pending ? (
            <span>Sending...</span>
          ) : null}
          <span>{formatTime(message.created_at)}</span>
        </span>
      </div>
    </div>
  );
}

function GroupInvitesPanel({ onChanged }: { onChanged: () => void }) {
  const [invites, setInvites] = useState<ChatGroupInvite[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await listGroupInvites();
      setInvites(data.invites);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invites");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function respond(invite: ChatGroupInvite, action: "accept" | "reject") {
    setBusy(invite.id);
    try {
      await respondGroupInvite(invite.id, action);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to respond");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-5">
      <h2 className="text-lg font-semibold text-white">Group Invites</h2>
      <p className="mt-1 text-sm text-zinc-500">Invitations to private groups.</p>
      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      <div className="mt-4 divide-y divide-zinc-900 overflow-hidden rounded-lg border border-zinc-900">
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center gap-3 p-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
              {invite.group?.title?.[0]?.toUpperCase() || <UsersIcon className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{invite.group?.title || "Private group"}</p>
              <p className="text-xs text-zinc-500">Encrypted group invitation</p>
            </div>
            <button
              onClick={() => respond(invite, "accept")}
              disabled={busy === invite.id}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 disabled:opacity-40"
            >
              Accept
            </button>
            <button
              onClick={() => respond(invite, "reject")}
              disabled={busy === invite.id}
              className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 disabled:opacity-40"
            >
              Reject
            </button>
          </div>
        ))}
        {!invites.length ? (
          <div className="p-3">
            <EmptyState
              icon={<UsersIcon className="h-6 w-6" />}
              title="No pending invites"
              description="Group invitations will land here when teams add you."
              tone="space"
              size="sm"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SearchStartPanel({ onStarted }: { onStarted: (conversation: ChatConversation) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ChatUser[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (query.trim().length < 2) return;
    const timer = window.setTimeout(async () => {
      try {
        const data = await searchChatUsers(query);
        if (!cancelled) setResults(data.users);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Search failed");
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  async function start(user: ChatUser) {
    try {
      setError("");
      if (user.chat_encryption_enabled === false) {
        throw new Error("This user has not enabled secure chat yet.");
      }
      if (!getStoredVault()) {
        throw new Error("Vault is locked. Enter your recovery key to unlock.");
      }
      const created = await createDirectConversation(user.id);
      const full = await getChatConversation(created.conversation.id);
      onStarted(full.conversation);
      setQuery("");
      setResults([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start chat");
    }
  }

  return (
    <div className="border-b border-zinc-900 p-4">
      <input
        value={query}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          if (next.trim().length < 2) setResults([]);
        }}
        placeholder="Search username"
        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
      />
      {error ? <p className="mt-2 text-xs text-rose-400">{error}</p> : null}
      {results.length > 0 ? (
        <div className="mt-3 divide-y divide-zinc-900 overflow-hidden rounded-lg border border-zinc-900">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => start(user)}
              disabled={user.chat_encryption_enabled === false}
              className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Avatar user={{ id: user.id, name: user.name || user.username || "User", avatar_url: user.avatar_url }} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white">@{user.username}</span>
                <span className="block truncate text-xs text-zinc-500">{user.chat_encryption_enabled === false ? "Secure chat not enabled" : user.headline || user.name}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RequestsPanel() {
  const [requests, setRequests] = useState<ChatMessageRequest[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await listMessageRequests();
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function respond(id: string, action: "accept" | "reject") {
    await respondMessageRequest(id, action);
    await load();
  }

  return (
    <div className="p-5">
      <h2 className="text-lg font-semibold text-white">Message Requests</h2>
      {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      <div className="mt-4 divide-y divide-zinc-900 overflow-hidden rounded-lg border border-zinc-900">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center gap-3 p-3">
            <Avatar user={{ id: request.from_user.id, name: request.from_user.name, avatar_url: request.from_user.avatar_url }} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">@{request.from_user.username}</p>
              <p className="text-xs text-zinc-500">Encrypted intro request</p>
            </div>
            <button onClick={() => respond(request.id, "accept")} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950">
              Accept
            </button>
            <button onClick={() => respond(request.id, "reject")} className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300">
              Reject
            </button>
          </div>
        ))}
        {!requests.length ? (
          <div className="p-3">
            <EmptyState
              icon={<CheckCircleIcon className="h-6 w-6" />}
              title="No pending requests"
              description="Intro requests will appear here before a new encrypted conversation starts."
              tone="question"
              size="sm"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SettingsPanel({
  userId,
  currentUsername,
  onUsernameUpdated,
  onResetCrypto,
  processing,
}: {
  userId: string;
  currentUsername?: string | null;
  onUsernameUpdated: (username: string) => void;
  onResetCrypto: () => void;
  processing: boolean;
}) {
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [username, setUsername] = useState(currentUsername || "");
  const [status, setStatus] = useState("");

  useEffect(() => {
    getChatSettings().then((data) => setSettings(data.settings)).catch((err) => setStatus(err.message));
  }, []);

  async function saveUsername() {
    const data = await updateChatUsername(username);
    onUsernameUpdated(data.user.username || username);
    setStatus("Username saved");
  }

  async function saveSettings(next: Partial<ChatSettings>) {
    const data = await updateChatSettings(next);
    setSettings(data.settings);
    setStatus("Settings saved");
  }

  return (
    <div className="max-w-2xl p-5">
      <h2 className="text-lg font-semibold text-white">Chat Settings</h2>
      <p className="mt-1 text-sm text-zinc-500">Your public chat identity is a username, not your email.</p>
      <div className="mt-5 space-y-5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Username</span>
          <div className="mt-2 flex gap-2">
            <input value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600" />
            <button onClick={saveUsername} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950">Save</button>
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Who can message you</span>
          <select
            value={settings?.chat_privacy_setting || "anyone"}
            onChange={(event) => saveSettings({ chat_privacy_setting: event.target.value as ChatSettings["chat_privacy_setting"] })}
            className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
          >
            <option value="anyone">Anyone</option>
            <option value="followers">People who follow you</option>
            <option value="following">People you follow</option>
            <option value="mutuals">Mutual follows</option>
            <option value="nobody">Nobody</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Who can see your last seen</span>
          <select
            value={settings?.last_seen_visibility || "anyone"}
            onChange={(event) => saveSettings({ last_seen_visibility: event.target.value as ChatSettings["last_seen_visibility"] })}
            className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
          >
            <option value="anyone">Anyone</option>
            <option value="mutuals">Mutual follows</option>
            <option value="nobody">Nobody</option>
          </select>
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings?.chat_enabled !== false}
            onChange={(event) => saveSettings({ chat_enabled: event.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm text-zinc-300">Enable direct messages</span>
        </label>
        {status ? <p className="text-sm text-emerald-400">{status}</p> : null}
        <p className="text-xs text-zinc-600">Device: {userId.slice(0, 8)}. Private chat keys stay in this browser storage.</p>
        <div className="border-t border-zinc-900 pt-5 mt-5">
          <span className="text-xs font-semibold uppercase tracking-wide text-rose-500 block mb-1">Danger Zone</span>
          <p className="text-xs text-zinc-500">If you lose your recovery key or suspect your account is compromised, you can reset your chat encryption profile. You will lose access to all previous encrypted messages.</p>
          <button
            onClick={onResetCrypto}
            disabled={processing}
            className="mt-3 rounded-lg border border-rose-800 bg-rose-950/20 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-900/40 disabled:opacity-40"
          >
            Reset Chat Encryption
          </button>
        </div>
      </div>
    </div>
  );
}

const decryptedMessagesCache: Record<string, ChatMessage[]> = {};

function clearDecryptedMessagesCache() {
  Object.keys(decryptedMessagesCache).forEach((key) => {
    delete decryptedMessagesCache[key];
  });
}

function mergeMessagesList(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map<string, ChatMessage>();
  existing.forEach((msg) => {
    const key = msg.client_message_id || msg.id;
    map.set(key, msg);
  });
  incoming.forEach((msg) => {
    const key = msg.client_message_id || msg.id;
    const prev = map.get(key);
    map.set(key, { ...prev, ...msg, ...(msg.id ? { pending: false, failed: false } : {}) });
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

function replaceMessageByClientId(messages: ChatMessage[], clientMessageId: string, replacement: ChatMessage): ChatMessage[] {
  return messages.map((item) => (item.client_message_id === clientMessageId ? replacement : item));
}

function sortConversations(rows: ChatConversation[]) {
  return [...rows].sort((a, b) => {
    const aPinned = a.pinned_at ? 1 : 0;
    const bPinned = b.pinned_at ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    return new Date(b.updated_at || b.last_message_at || 0).getTime() - new Date(a.updated_at || a.last_message_at || 0).getTime();
  });
}

export default function ChatPage() {
  const { user, refreshUser } = useAuth();
  const [mode, setMode] = useState<ViewMode>("inbox");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [active, setActive] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [deviceReady, setDeviceReady] = useState(false);
  const [vaultLocked, setVaultLocked] = useState(false);
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [cryptoChecking, setCryptoChecking] = useState(true);
  const [inputPin, setInputPin] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isResettingE2EE, setIsResettingE2EE] = useState(false);
  const [processingCrypto, setProcessingCrypto] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentViews, setAttachmentViews] = useState<Record<string, AttachmentView>>({});
  const [activeMenuOpen, setActiveMenuOpen] = useState(false);

  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const prevActiveIdRef = useRef<string | null>(null);
  const prevMessagesCountRef = useRef(0);
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const socket = useChatSocket(Boolean(user && deviceReady));
  const activeIsGroup = active?.type === "group";
  const groupChat = useGroupChat(activeIsGroup ? active?.id || null : null);
  const activeId = active?.id || null;

  const getParticipantUserIds = useCallback((conversation: ChatConversation | null) => {
    if (!user || !conversation) return [];
    if (conversation.type === "group") {
      return Array.from(new Set([user.id, ...groupChat.members.map((member) => member.user_id)]));
    }
    return Array.from(new Set(conversation.other_user?.id ? [user.id, conversation.other_user.id] : [user.id]));
  }, [groupChat.members, user]);

  const activeRef = useRef<ChatConversation | null>(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      setMessagesLoaded(false);
      setPendingAttachments([]);
      return;
    }
    const cached = decryptedMessagesCache[activeId];
    setMessages(cached || []);
    setMessagesLoaded(Boolean(cached));
    setPendingAttachments([]);
    setActiveMenuOpen(false);
  }, [activeId]);

  const mergeConversation = useCallback((conversation: ChatConversation) => {
    const normalized = activeRef.current?.id === conversation.id
      ? { ...conversation, unread_count: 0 }
      : conversation;
    setConversations((prev) => {
      const exists = prev.some((item) => item.id === normalized.id);
      const next = exists
        ? prev.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item))
        : [normalized, ...prev];
      return sortConversations(next);
    });
    setActive((current) => (current?.id === normalized.id ? { ...current, ...normalized } : current));
  }, []);

  const loadConversations = useCallback(async () => {
    setConversationsLoading(true);
    try {
      const data = await listChatConversations();
      setConversations(data.conversations);
      setActive((current) => current ? data.conversations.find((conversation) => conversation.id === current.id) || current : data.conversations[0] || null);
      return true;
    } catch (err) {
      console.error("Failed to load conversations", err);
      setError(err instanceof TypeError
        ? "Unable to reach the chat server. Check that the backend tunnel is running and CORS changes are deployed."
        : err instanceof Error ? err.message : "Failed to load conversations");
      return false;
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversation: ChatConversation) => {
    const cached = decryptedMessagesCache[conversation.id];
    if (cached) {
      setMessages(cached);
    } else {
      setMessages([]);
    }
    setMessagesLoaded(Boolean(cached));
    setMessagesLoading(!cached);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id ? { ...c, unread_count: 0 } : c
      )
    );

    try {
      const fetchHistoryPromise = listChatMessages(conversation.id);
      const syncKeysPromise = syncConversationKeys(conversation.id, [], { allowCreate: false, allowRepair: false });

      const [data] = await Promise.all([fetchHistoryPromise, syncKeysPromise.catch(() => undefined)]);

      const decryptor = conversation.type === "group" ? decryptGroupMessage : decryptChatMessage;
      const decrypted = await Promise.all(data.messages.reverse().map((message) => decryptor(message as ChatMessage)));
      const participantUserIds = getParticipantUserIds(conversation);
      const encryptedMessages = decrypted.filter((message) => message.ciphertext && !message.deleted_for_everyone_at);
      const hasWorkingKey = encryptedMessages.some((message) => message.decrypted_body && !message.decrypt_failed);
      if (participantUserIds.length > 0 && (!encryptedMessages.length || hasWorkingKey)) {
        void syncConversationKeys(conversation.id, participantUserIds, { allowCreate: false, allowRepair: true }).catch(() => undefined);
      }

      // Read cache after API fetch to include socket messages that arrived during fetch
      const merged = mergeMessagesList(
        decryptedMessagesCache[conversation.id] || [],
        decrypted,
      );
      decryptedMessagesCache[conversation.id] = merged;

      if (activeRef.current?.id === conversation.id) {
        setMessages(merged);
      }
      setMessagesLoaded(true);

      const lastDecrypted = decrypted[decrypted.length - 1];
      const lastMessageId = lastDecrypted?.id || data.messages[data.messages.length - 1]?.id;
      if (lastMessageId) {
        void markChatRead(conversation.id, lastMessageId).catch(() => undefined);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
      setMessagesLoaded(true);
    } finally {
      setMessagesLoading(false);
    }
  }, [getParticipantUserIds]);

  useEffect(() => {
    let cancelled = false;
    async function bootChat() {
      if (!user) {
        setDeviceReady(false);
        setCryptoChecking(false);
        return;
      }
      setError("");
      setCryptoChecking(true);
      const vault = getStoredVault();

      if (vault) {
        if (cancelled) return;
        setVaultLocked(false);
        setSetupNeeded(false);
        setDeviceReady(true);
        setCryptoChecking(false);
        await loadConversations();
        return;
      }

      try {
        await fetchUserCryptoProfile(user.id);
        if (cancelled) return;
        setVaultLocked(true);
        setSetupNeeded(false);
        setDeviceReady(false);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "";
        if (/not found|no crypto profile/i.test(message)) {
          setSetupNeeded(true);
          setVaultLocked(false);
          setDeviceReady(false);
        } else {
          setError(err instanceof Error ? err.message : "Unable to verify chat encryption status.");
          setSetupNeeded(false);
          setVaultLocked(true);
          setDeviceReady(false);
        }
      } finally {
        if (!cancelled) setCryptoChecking(false);
      }
    }
    bootChat();
    return () => {
      cancelled = true;
    };
  }, [loadConversations, user]);

  useEffect(() => {
    let cancelled = false;
    async function loadPreviews() {
      if (!deviceReady) return;
      if (!conversations.length) {
        setPreviews({});
        return;
      }
      const rows = await Promise.all(conversations.map(async (conversation) => {
        try {
          return [conversation.id, await decryptConversationPreview(conversation, user?.id)] as const;
        } catch {
          return [conversation.id, "Encrypted message"] as const;
        }
      }));
      if (!cancelled) setPreviews(Object.fromEntries(rows));
    }
    loadPreviews();
    return () => {
      cancelled = true;
    };
  }, [conversations, deviceReady]);

  useEffect(() => {
    const conversation = activeRef.current;
    if (!conversation || !activeId) return;
    let cancelled = false;
    void socket.joinConversationWithAck(activeId).finally(() => {
      if (!cancelled) loadMessages(conversation).catch((err) => setError(err.message));
    });
    return () => {
      cancelled = true;
      socket.leaveConversation(activeId);
    };
  }, [activeId, loadMessages, socket]);

  useEffect(() => {
    const offNew = socket.on("message:new", async (payload) => {
      const incoming = payload as ChatMessage;
      const isGroupMessage = Boolean(incoming.group_payload);
      const decryptor = isGroupMessage ? decryptGroupMessage : decryptChatMessage;

      // Fast path: try decrypt immediately with what's already in the vault.
      // Only hit the server for key shares if the key is genuinely missing.
      let message = await decryptor(incoming);
      if (message.missing_envelope) {
        await syncConversationKeys(incoming.conversation_id).catch(() => undefined);
        message = await decryptor(incoming);
      }

      const isCurrentActive = activeRef.current?.id === message.conversation_id;

      const cacheKey = message.conversation_id;
      decryptedMessagesCache[cacheKey] = mergeMessagesList(
        decryptedMessagesCache[cacheKey] || [],
        [message],
      );

      if (isCurrentActive) {
        setMessages((prev) => {
          if (prev.some((item) => item.id === message.id)) return prev;
          if (message.client_message_id && prev.some((item) => item.client_message_id === message.client_message_id)) {
            return replaceMessageByClientId(prev, message.client_message_id, message);
          }
          return [...prev, message];
        });
        await markChatRead(message.conversation_id, message.id).catch(() => undefined);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === message.conversation_id ? { ...c, unread_count: 0 } : c
          )
        );
      }
    });
    const offUpdate = socket.on("conversation:updated", (payload) => {
      const update = payload as { conversation?: ChatConversation; conversation_id?: string };
      if (update.conversation) {
        mergeConversation(update.conversation);
        return;
      }
      loadConversations().catch(() => undefined);
    });
    return () => {
      offNew?.();
      offUpdate?.();
    };
  }, [loadConversations, mergeConversation, socket]);

  useEffect(() => {
    if (!socket.lastConnectedAt) return;
    const conversation = activeRef.current;
    if (!conversation) return;
    loadMessages(conversation).catch(() => undefined);
  }, [loadMessages, socket.lastConnectedAt]);

  useEffect(() => {
    let cancelled = false;
    async function loadAttachmentViews() {
      const attachments = messages.flatMap((message) => message.attachments || []);
      const missing = attachments.filter((attachment) => attachment.download_url && !attachmentViews[attachment.id]);
      if (!missing.length) return;
      const entries = await Promise.all(missing.map(async (attachment) => {
        try {
          const decrypted = await decryptAttachment(resolveAttachmentDownloadUrl(attachment.download_url as string), attachment.encrypted_metadata);
          const url = URL.createObjectURL(decrypted.blob);
          return [attachment.id, {
            url,
            name: decrypted.metadata.name,
            type: decrypted.metadata.type,
            size: decrypted.metadata.size,
          }] as const;
        } catch {
          return null;
        }
      }));
      if (!cancelled) {
        setAttachmentViews((prev) => ({ ...prev, ...Object.fromEntries(entries.filter(Boolean) as Array<readonly [string, AttachmentView]>) }));
      }
    }
    loadAttachmentViews();
    return () => {
      cancelled = true;
    };
  }, [attachmentViews, messages]);

  useEffect(() => {
    if (!messagesEndRef.current || typeof messagesEndRef.current.scrollIntoView !== "function") return;

    const activeIdChanged = prevActiveIdRef.current !== activeId;
    const isNewMessage =
      !activeIdChanged &&
      messages.length > prevMessagesCountRef.current &&
      prevMessagesCountRef.current > 0;

    if (activeIdChanged || !isNewMessage) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    } else {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }

    prevActiveIdRef.current = activeId;
    prevMessagesCountRef.current = messages.length;
  }, [messages, activeId]);

  async function handleSetupE2EE(event: React.FormEvent) {
    event.preventDefault();
    if (!setupPin || !confirmPin) {
      setError("Please fill in both PIN fields.");
      return;
    }
    const cleanPin = setupPin.replace(/\D/g, "");
    const cleanConfirm = confirmPin.replace(/\D/g, "");
    if (cleanPin.length !== 4 || cleanConfirm.length !== 4) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    if (cleanPin !== cleanConfirm) {
      setError("PINs do not match.");
      return;
    }
    setProcessingCrypto(true);
    setError("");
    try {
      await setupEncryptedChat(cleanPin);
      setSetupNeeded(false);
      setVaultLocked(false);
      setDeviceReady(true);
      if (user) {
        refreshUser({ ...user, chat_encryption_enabled: true });
      }
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to setup E2EE");
    } finally {
      setProcessingCrypto(false);
    }
  }

  async function handleUnlockE2EE(event: React.FormEvent) {
    event.preventDefault();
    const cleanPin = inputPin.replace(/\D/g, "");
    if (!cleanPin) return;
    if (cleanPin.length !== 4) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    if (!user) return;
    setProcessingCrypto(true);
    setError("");
    try {
      await restoreEncryptedChat(cleanPin, user.id);
      clearDecryptedMessagesCache();
      setMessages([]);
      setInputPin("");
      setVaultLocked(false);
      setDeviceReady(true);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock");
    } finally {
      setProcessingCrypto(false);
    }
  }

  async function handleResetE2EE(event: React.FormEvent) {
    event.preventDefault();
    if (!setupPin || !confirmPin) {
      setError("Please fill in both PIN fields.");
      return;
    }
    const cleanPin = setupPin.replace(/\D/g, "");
    const cleanConfirm = confirmPin.replace(/\D/g, "");
    if (cleanPin.length !== 4 || cleanConfirm.length !== 4) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    if (cleanPin !== cleanConfirm) {
      setError("PINs do not match.");
      return;
    }
    if (!confirm("Are you sure you want to reset your encryption? Your previous encrypted messages will not be recoverable on this device. This cannot be undone.")) {
      return;
    }
    setProcessingCrypto(true);
    setError("");
    try {
      clearDecryptedMessagesCache();
      setMessages([]);

      await resetEncryptedChat(cleanPin);
      setSetupPin("");
      setConfirmPin("");
      setIsResettingE2EE(false);
      setSetupNeeded(false);
      setVaultLocked(false);
      setDeviceReady(true);
      if (user) {
        refreshUser({ ...user, chat_encryption_enabled: true });
      }
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset encryption");
    } finally {
      setProcessingCrypto(false);
    }
  }

  function triggerResetFlow() {
    setIsResettingE2EE(true);
    setSetupNeeded(true);
    setVaultLocked(false);
    setError("");
    setSetupPin("");
    setConfirmPin("");
  }

  async function uploadStagedAttachment(attachment: PendingAttachment, conversationId: string) {
    if (attachment.attachmentId) return attachment.attachmentId;
    const localId = attachment.id;
    setPendingAttachments((prev) => prev.map((item) => item.id === localId ? { ...item, status: "uploading", progress: 5, error: undefined } : item));
    try {
      const encrypted = await encryptAttachment(attachment.file);
      setPendingAttachments((prev) => prev.map((item) => item.id === localId ? { ...item, progress: 40 } : item));
      const upload = await uploadEncryptedAttachmentBlob(encrypted.encryptedBlob);
      setPendingAttachments((prev) => prev.map((item) => item.id === localId ? { ...item, progress: 80 } : item));
      const completed = await completeEncryptedAttachment({
        conversation_id: conversationId,
        storage_key: upload.storage_key,
        encrypted_metadata: encrypted.encrypted_metadata,
        size_bytes: encrypted.encryptedBlob.size,
      }) as { attachment: { id: string } };
      setPendingAttachments((prev) => prev.map((item) => item.id === localId ? {
        ...item,
        status: "ready",
        progress: 100,
        attachmentId: completed.attachment.id,
        encryptedMetadata: encrypted.encrypted_metadata,
      } : item));
      return completed.attachment.id;
    } catch (err) {
      setPendingAttachments((prev) => prev.map((item) => item.id === localId ? {
        ...item,
        status: "failed",
        progress: 0,
        error: err instanceof Error ? err.message : "Upload failed",
      } : item));
      throw err;
    }
  }

  async function uploadAttachment(file: File) {
    if (!active) return;
    const localId = crypto.randomUUID();
    setPendingAttachments((prev) => [...prev, { id: localId, file, status: "local", progress: 0 }]);
  }

  function handleAttachmentFiles(files: FileList | null) {
    if (!files || !active) return;
    Array.from(files).slice(0, 6).forEach((file) => {
      void uploadAttachment(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function sendMessage(retryMessage?: ChatMessage) {
    if (!user || !active) return;
    const body = (retryMessage?.decrypted_body || draft).trim();
    const stagedAttachments = retryMessage ? [] : pendingAttachments.filter((attachment) => attachment.status === "local" || attachment.status === "ready");
    const uploading = pendingAttachments.some((attachment) => attachment.status === "uploading");
    if (uploading) return;
    if (!body && !stagedAttachments.length) return;
    const client_message_id = retryMessage?.client_message_id || crypto.randomUUID();
    const vault = getStoredVault();
    if (!vault) {
      setError("Key vault not unlocked. Unlock to send messages.");
      return;
    }
    const cachedHistory = decryptedMessagesCache[active.id] || messages;
    const encryptedHistory = cachedHistory.filter((message) => message.ciphertext && !message.deleted_for_everyone_at && !message.pending);
    const hasReadableHistory = encryptedHistory.some((message) => message.decrypted_body && !message.decrypt_failed);
    const hasFailedHistory = encryptedHistory.some((message) => message.decrypt_failed || message.missing_envelope);
    if (encryptedHistory.length > 0 && hasFailedHistory && !hasReadableHistory) {
      setError("This device has not recovered the original key for this chat. Open the chat on a device that can read the history so it can re-share the key, or use the explicit encryption reset flow.");
      return;
    }

    let uploadedAttachmentIds: string[] = [];
    try {
      uploadedAttachmentIds = [];
      for (const attachment of stagedAttachments) {
        // eslint-disable-next-line no-await-in-loop
        const attachmentId = await uploadStagedAttachment(attachment, active.id);
        uploadedAttachmentIds.push(attachmentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Attachment upload failed");
      return;
    }

    const pendingMsg: ChatMessage = {
      id: retryMessage?.id || client_message_id,
      client_message_id,
      conversation_id: active.id,
      sender_id: user.id,
      message_type: uploadedAttachmentIds.length ? (body ? "mixed" : "attachment") : "text",
      attachment_count: uploadedAttachmentIds.length,
      encryption_version: "webcrypto-v2",
      created_at: new Date().toISOString(),
      decrypted_body: body,
      envelopes: [],
      pending: true,
      failed: false,
    };

    if (!retryMessage) {
      setDraft("");
    }

    setMessages((prev) => {
      if (prev.some((item) => item.client_message_id === client_message_id)) {
        return replaceMessageByClientId(prev, client_message_id, pendingMsg);
      }
      return [...prev, pendingMsg];
    });
    decryptedMessagesCache[active.id] = mergeMessagesList(
      decryptedMessagesCache[active.id] || [],
      [pendingMsg],
    );
    setPreviews((prev) => ({ ...prev, [active.id]: body }));
    mergeConversation({
      ...active,
      last_message_id: active.last_message_id || client_message_id,
      last_message_at: pendingMsg.created_at,
      updated_at: pendingMsg.created_at,
      last_message: pendingMsg,
      unread_count: 0,
    });

    try {
      const participantUserIds = getParticipantUserIds(active);

      const epochNumber = await syncConversationKeys(active.id, participantUserIds);

      const encrypted = await encryptChatMessage({
        conversationId: active.id,
        epochNumber,
        body,
      });

      const sendPayload: Record<string, unknown> = {
        client_message_id,
        message_type: uploadedAttachmentIds.length ? (body ? "mixed" : "attachment") : "text",
        attachment_count: uploadedAttachmentIds.length,
        encryption_version: encrypted.encryption_version,
        ciphertext: encrypted.ciphertext,
        nonce_or_iv: encrypted.nonce_or_iv,
        key_epoch_id: encrypted.key_epoch_id,
      };
      if (uploadedAttachmentIds.length) sendPayload.attachment_ids = uploadedAttachmentIds;

      const data = await sendEncryptedChatMessage(active.id, sendPayload);

      try {
        const decrypted = activeIsGroup ? await decryptGroupMessage(data.message) : await decryptChatMessage(data.message);
        setMessages((prev) => replaceMessageByClientId(prev, client_message_id, decrypted));
        decryptedMessagesCache[active.id] = replaceMessageByClientId(
          decryptedMessagesCache[active.id] || [],
          client_message_id,
          decrypted,
        );
      } catch {
        // Server confirmed the message; decrypt of own echo failed but socket will resolve it
      }

      mergeConversation({
        ...active,
        last_message_id: data.message.id,
        last_message_at: data.message.created_at,
        updated_at: data.message.created_at,
        last_message: data.message,
        unread_count: 0,
      });
      if (!retryMessage) {
        const sentIds = new Set(stagedAttachments.map((attachment) => attachment.id));
        setPendingAttachments((prev) => prev.filter((attachment) => attachment.status === "failed" || !sentIds.has(attachment.id)));
      }
    } catch (err) {
      const failed = { ...pendingMsg, pending: false, failed: true };
      setMessages((prev) => replaceMessageByClientId(prev, client_message_id, failed));
      decryptedMessagesCache[active.id] = replaceMessageByClientId(
        decryptedMessagesCache[active.id] || [],
        client_message_id,
        failed,
      );
      setError(err instanceof Error ? err.message : "Message failed");
    }
  }

  async function handleCreateGroup(input: { title: string; description?: string | null; member_user_ids: string[] }) {
    if (!user) return;
    if (!getStoredVault()) {
      setError("Key vault not unlocked. Unlock to create a group.");
      return;
    }
    setCreatingGroup(true);
    setError("");
    try {
      const result = await createGroup({
        title: input.title,
        description: input.description,
        member_user_ids: input.member_user_ids,
        epoch_envelopes: [],
      });
      const allTargets = Array.from(new Set([user.id, ...input.member_user_ids]));
      await shareConversationKey(result.conversation.id, 1, allTargets);
      const full = await getChatConversation(result.conversation.id);
      await loadConversations();
      setActive(full.conversation);
      void groupChat.sync(result.conversation.id).catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
      throw err;
    } finally {
      setCreatingGroup(false);
    }
  }

  async function togglePin(conversation: ChatConversation) {
    const pinned = !conversation.pinned_at;
    const pinnedAt = pinned ? new Date().toISOString() : null;
    const optimistic = { ...conversation, pinned_at: pinnedAt };
    setConversations((prev) => sortConversations(prev.map((item) => item.id === conversation.id ? optimistic : item)));
    setActive((current) => current?.id === conversation.id ? { ...current, pinned_at: pinnedAt } : current);
    try {
      await updateChatConversationPin(conversation.id, pinned);
      await loadConversations();
    } catch (err) {
      setConversations((prev) => sortConversations(prev.map((item) => item.id === conversation.id ? conversation : item)));
      setActive((current) => current?.id === conversation.id ? conversation : current);
      setError(err instanceof Error ? err.message : "Failed to update pin");
    }
  }

  if (!user || cryptoChecking) return <div className="p-6 text-sm text-zinc-400">Loading chat…</div>;

  if (setupNeeded) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <LockIcon className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-white">
              {isResettingE2EE ? "Reset Encryption Profile" : "Enable End-to-End Encryption"}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {isResettingE2EE
                ? "Set a new 4-digit PIN for your chat backup. Old history cannot be recovered."
                : "Create a 4-digit PIN to secure your chat backup. This PIN is required to restore chats on other devices."}
            </p>
          </div>

          <form onSubmit={isResettingE2EE ? handleResetE2EE : handleSetupE2EE} className="mt-6 space-y-4">
            {isResettingE2EE && (
              <div className="rounded-lg bg-rose-950/20 border border-rose-900/50 p-4 text-xs text-rose-300">
                <p className="font-semibold">Resetting Profile Warning:</p>
                <p className="mt-1">
                  Your previous encrypted messages will be lost permanently on this device. This action cannot be undone.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="setupPin" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Create 4-Digit PIN
              </label>
              <input
                id="setupPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                placeholder="••••"
                value={setupPin}
                onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-center text-xl tracking-[0.75em] text-white outline-none focus:border-zinc-600 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPin" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Confirm 4-Digit PIN
              </label>
              <input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-center text-xl tracking-[0.75em] text-white outline-none focus:border-zinc-600 transition-colors"
                required
              />
            </div>

            {error ? <p className="text-sm text-rose-400 text-center">{error}</p> : null}

            <button
              type="submit"
              disabled={processingCrypto || setupPin.length !== 4 || confirmPin.length !== 4}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 transition-colors"
            >
              {processingCrypto ? "Processing…" : isResettingE2EE ? "Reset & Enable E2EE" : "Enable E2EE Chat"}
            </button>

            {isResettingE2EE && (
              <button
                type="button"
                onClick={() => {
                  setIsResettingE2EE(false);
                  setSetupNeeded(false);
                  setVaultLocked(true);
                  setError("");
                }}
                className="w-full rounded-xl border border-zinc-800 bg-transparent py-3 text-sm font-semibold text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      </main>
    );
  }

  if (vaultLocked) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <LockIcon className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-white">Unlock Your Secure Chats</h2>
            <p className="mt-2 text-sm text-zinc-400">
              This device does not have access to your chat encryption keys. Enter your secure 4-digit PIN to decrypt your backup.
            </p>
          </div>

          <form onSubmit={handleUnlockE2EE} className="mt-6 space-y-4">
            <div>
              <label htmlFor="unlockPin" className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Enter 4-Digit PIN
              </label>
              <input
                id="unlockPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                placeholder="••••"
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-center text-xl tracking-[0.75em] text-white outline-none focus:border-zinc-600 transition-colors"
                required
              />
            </div>

            {error ? <p className="text-sm text-rose-400 text-center">{error}</p> : null}

            <button
              type="submit"
              disabled={processingCrypto || inputPin.length !== 4}
              className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:opacity-40 transition-colors"
            >
              {processingCrypto ? "Unlocking backup…" : "Unlock Chats"}
            </button>

            <div className="border-t border-zinc-800 pt-5 text-center">
              <p className="text-xs text-zinc-500">
                Forgotten your PIN? You can reset your E2EE profile, but you will permanently lose access to all previous messages.
              </p>
              <button
                type="button"
                onClick={triggerResetFlow}
                disabled={processingCrypto}
                className="mt-3 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
              >
                Reset E2EE Profile & Start Fresh
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  return (
    <CallProvider user={user} socket={socket}>
    <main className="h-[calc(100dvh-64px)] min-h-0 overflow-hidden bg-zinc-950 text-white">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <aside className={`min-h-0 w-full flex-col border-b border-zinc-900 lg:flex lg:w-[360px] lg:border-b-0 lg:border-r ${active ? "hidden lg:flex" : "flex"}`}>
          <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-4">
            <div className="flex items-center gap-2">
              <ChatBubbleIcon className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Messages</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCreateGroupOpen(true)}
                className="flex items-center gap-1 rounded-lg border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-900"
                title="New group"
              >
                <PlusIcon className="h-4 w-4" /> Group
              </button>
              <LockIcon className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="grid grid-cols-4 border-b border-zinc-900 text-sm">
            {(["inbox", "requests", "group-invites", "settings"] as ViewMode[]).map((item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className={`px-2 py-2 capitalize ${mode === item ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {item === "group-invites" ? "invites" : item}
              </button>
            ))}
          </div>
          {mode === "inbox" ? (
            <>
              <SearchStartPanel
                onStarted={(conversation) => {
                  setActive(conversation);
                  setShowGroupInfo(false);
                  mergeConversation(conversation);
                }}
              />
              <div className="min-h-0 flex-1 overflow-y-auto">
                {conversationsLoading ? (
                  <div className="grid min-h-40 place-items-center text-sm text-zinc-500">Loading chats...</div>
                ) : conversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    active={active?.id === conversation.id}
                    preview={previews[conversation.id]}
                    onSelect={() => { setActive(conversation); setShowGroupInfo(false); }}
                    onTogglePin={() => { void togglePin(conversation); }}
                  />
                ))}
                {!conversationsLoading && !conversations.length ? (
                  <div className="p-3">
                    <EmptyState
                      icon={<ChatBubbleIcon className="h-6 w-6" />}
                      title="Start a conversation"
                      description="Search a username to start an encrypted DM, or create a group for your team."
                      tone="question"
                      size="sm"
                    />
                  </div>
                ) : null}
              </div>
            </>
          ) : mode === "requests" ? (
            <RequestsPanel />
          ) : mode === "group-invites" ? (
            <GroupInvitesPanel onChanged={() => loadConversations().catch(() => undefined)} />
          ) : (
            <SettingsPanel
              userId={user.id}
              currentUsername={user.username}
              onUsernameUpdated={(username) => refreshUser({ ...user, username })}
              onResetCrypto={triggerResetFlow}
              processing={processingCrypto}
            />
          )}
        </aside>

        <section className={`flex min-w-0 flex-1 flex-col ${active ? "flex" : "hidden lg:flex"}`}>
          {active ? (
            <>
              <header className="flex shrink-0 items-center justify-between border-b border-zinc-900 px-3 py-3 sm:px-5 sm:py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    onClick={() => setActive(null)}
                    className="mr-1 rounded-lg p-1 text-zinc-400 hover:bg-zinc-900 hover:text-white lg:hidden"
                    title="Back to chats"
                  >
                    <ArrowLeftIcon className="h-6 w-6" />
                  </button>
                  {activeIsGroup ? (
                    <>
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
                        {active.group?.title?.[0]?.toUpperCase() || <UsersIcon className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{active.group?.title || "Private group"}</p>
                        <p className="truncate text-xs text-zinc-500">{groupChat.members.length ? `${groupChat.members.length} members` : "syncing group"}</p>
                      </div>
                    </>
                  ) : (
                    <Link href={profileHref(active.other_user)} className="flex min-w-0 items-center gap-3 rounded-lg pr-2 hover:bg-zinc-900/60">
                      <Avatar user={active.other_user ? { id: active.other_user.id, name: active.other_user.name || active.other_user.username || "User", avatar_url: active.other_user.avatar_url } : null} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{`@${active.other_user?.username || "user"}`}</p>
                        <p className="truncate text-xs text-zinc-500">{formatLastSeen(active.other_user)}</p>
                      </div>
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <CallErrorBoundary>
                    <ConversationCallControls conversation={active} />
                  </CallErrorBoundary>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuOpen((value) => !value)}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                      title="Chat options"
                      aria-label="Chat options"
                    >
                      <DotsIcon className="h-4 w-4" />
                    </button>
                    {activeMenuOpen ? (
                      <>
                        <button
                          type="button"
                          aria-label="Close chat options"
                          className="fixed inset-0 z-30 cursor-default"
                          onClick={() => setActiveMenuOpen(false)}
                        />
                        <div className="absolute right-0 z-40 mt-1.5 w-36 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 py-1 shadow-2xl">
                          <button
                            type="button"
                            onClick={() => {
                              void togglePin(active);
                              setActiveMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-900 hover:text-white"
                          >
                            {active.pinned_at ? (
                              <>
                                <PinSlashIcon className="h-3.5 w-3.5 text-zinc-500" />
                                <span>Unpin chat</span>
                              </>
                            ) : (
                              <>
                                <PinIcon className="h-3.5 w-3.5 text-zinc-500" />
                                <span>Pin chat</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                  {activeIsGroup ? (
                    <button onClick={() => setShowGroupInfo((value) => !value)} className="flex items-center gap-1 rounded-lg border border-zinc-800 px-2 py-1 text-zinc-200 hover:bg-zinc-900">
                      <UsersIcon className="h-4 w-4" /> Info
                    </button>
                  ) : null}
                </div>
              </header>
              <CallErrorBoundary>
                <OngoingGroupCallBanner conversation={active} />
              </CallErrorBoundary>
              {error ? <div className="border-b border-rose-950 bg-rose-950/30 px-5 py-2 text-sm text-rose-300">{error}</div> : null}
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-5 sm:py-5">
                {messagesLoading ? (
                  <div className="grid min-h-40 place-items-center text-sm text-zinc-500">Loading messages...</div>
                ) : messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    currentUserId={user.id}
                    attachmentViews={attachmentViews}
                    showSender={activeIsGroup}
                    senderLabel={activeIsGroup ? (groupChat.members.find((member) => member.user_id === message.sender_id)?.user?.username || "Member") : undefined}
                    onRetry={message.failed ? sendMessage : undefined}
                  />
                ))}
                {!messagesLoading && messagesLoaded && !messages.length ? (
                  <EmptyState
                    icon={<LockIcon className="h-7 w-7" />}
                    title="No messages yet"
                    description="Send the first encrypted message to get this thread going."
                    tone="question"
                    size="md"
                    className="mx-4 my-8"
                  />
                ) : null}
                <div ref={messagesEndRef} />
              </div>
              <div className="shrink-0 border-t border-zinc-900 bg-zinc-950 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
                {pendingAttachments.length ? (
                  <div className="mb-3 flex gap-2 overflow-x-auto">
                    {pendingAttachments.map((attachment) => (
                      <div key={attachment.id} className="flex max-w-[220px] shrink-0 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
                        <FolderIcon className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{attachment.file.name}</span>
                          <span className={attachment.status === "failed" ? "text-rose-400" : "text-zinc-500"}>
                            {attachment.status === "local" ? "Ready to send" : attachment.status === "uploading" ? `Uploading ${attachment.progress}%` : attachment.status === "ready" ? "Uploaded" : attachment.error || "Failed"}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setPendingAttachments((prev) => prev.filter((item) => item.id !== attachment.id))}
                          className="text-zinc-500 hover:text-white"
                          aria-label="Remove attachment"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendMessage();
                  }}
                  className="flex items-end gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(event) => handleAttachmentFiles(event.target.files)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white"
                    title="Attach files"
                    aria-label="Attach files"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    onFocus={() => socket.emitTyping(active.id, true)}
                    onBlur={() => socket.emitTyping(active.id, false)}
                    placeholder={activeIsGroup && !groupChat.currentEpoch ? "Syncing group encryption key…" : "Write an encrypted message"}
                    rows={1}
                    className="max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-zinc-600"
                  />
                  <button
                    disabled={(!draft.trim() && !pendingAttachments.some((attachment) => attachment.status === "local" || attachment.status === "ready")) || pendingAttachments.some((attachment) => attachment.status === "uploading") || (activeIsGroup && !groupChat.currentEpoch)}
                    className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div>
                <XCircleIcon className="mx-auto h-8 w-8 text-zinc-700" />
                <p className="mt-3 text-sm text-zinc-500">Choose or start a conversation, or create a group.</p>
              </div>
            </div>
          )}
        </section>
        {activeIsGroup && active && showGroupInfo ? (
          <GroupInfoPanel
            conversation={active}
            currentUserId={user.id}
            onClose={() => setShowGroupInfo(false)}
            onLeftOrDeleted={() => {
              setShowGroupInfo(false);
              if (active?.id) delete decryptedMessagesCache[active.id];
              setActive(null);
              setMessages([]);
              loadConversations().catch(() => undefined);
            }}
            onChanged={() => {
              getChatConversation(active.id).then((data) => setActive(data.conversation)).catch(() => undefined);
              loadConversations().catch(() => undefined);
            }}
          />
        ) : null}
      </div>
      <CreateGroupModal
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        busy={creatingGroup}
        onCreate={handleCreateGroup}
      />
    </main>
    </CallProvider>
  );
}
