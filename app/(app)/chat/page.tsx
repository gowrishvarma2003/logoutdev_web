"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { ChatBubbleIcon, CheckCircleIcon, LockIcon, PlusIcon, UsersIcon, XCircleIcon } from "@/components/ui/Icons";
import { useAuth } from "@/lib/hooks/useAuth";
import { useChatSocket } from "@/lib/hooks/useChatSocket";
import { useGroupChat } from "@/lib/hooks/useGroupChat";
import type { ChatConversation, ChatGroupInvite, ChatMessage, ChatMessageRequest, ChatSettings, ChatUser } from "@/lib/types";
import {
  createDirectConversation,
  getChatConversation,
  getChatSettings,
  listChatConversations,
  listChatMessages,
  listMessageRequests,
  markChatRead,
  respondMessageRequest,
  searchChatUsers,
  sendEncryptedChatMessage,
  updateChatSettings,
  updateChatUsername,
} from "@/lib/services/chatApi";
import {
  createGroup,
  listGroupInvites,
  respondGroupInvite,
} from "@/lib/services/groupApi";
import {
  buildEncryptedMessageEnvelopes,
  decryptChatMessage,
  decryptGroupMessage,
  ensureChatDeviceRegistered,
  wrapGroupKeyForMembers,
} from "@/lib/chatCrypto";
import CreateGroupModal from "@/components/chat/CreateGroupModal";
import GroupInfoPanel from "@/components/chat/GroupInfoPanel";

type ViewMode = "inbox" | "requests" | "group-invites" | "settings";

function formatTime(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function previewTextFromMessage(message: ChatMessage | null | undefined) {
  if (!message) return "";
  if (message.deleted_for_everyone_at) return "Message deleted";
  if (message.decrypted_body) return message.decrypted_body;
  if (message.missing_envelope) return "Message not available on this device";
  if (message.decrypt_failed) return "Could not decrypt message";
  return "Encrypted message";
}

async function decryptConversationPreview(conversation: ChatConversation) {
  if (!conversation.last_message) return "";
  const decrypted = conversation.type === "group"
    ? await decryptGroupMessage(conversation.last_message)
    : await decryptChatMessage(conversation.last_message);
  return previewTextFromMessage(decrypted);
}

function ConversationRow({
  conversation,
  active,
  preview,
  onSelect,
}: {
  conversation: ChatConversation;
  active: boolean;
  preview?: string;
  onSelect: () => void;
}) {
  const isGroup = conversation.type === "group";
  const other = conversation.other_user;
  const title = isGroup ? conversation.group?.title || "Private group" : other?.username ? `@${other.username}` : other?.name || "Unknown user";
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 border-b border-zinc-900 px-4 py-3 text-left transition-colors ${
        active ? "bg-zinc-900" : "hover:bg-zinc-900/60"
      }`}
    >
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
          <span className="shrink-0 text-[11px] text-zinc-500">{formatTime(conversation.last_message_at || conversation.updated_at)}</span>
        </span>
        <span className="mt-1 flex items-center gap-1 truncate text-xs text-zinc-500">
          {!isGroup ? <LockIcon className="h-3.5 w-3.5" /> : null}
          <span className="truncate">{preview || (conversation.last_message_id ? "Message not available on this device" : "No messages yet")}</span>
        </span>
      </span>
      {conversation.unread_count > 0 ? (
        <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-zinc-950">
          {conversation.unread_count > 99 ? "99+" : conversation.unread_count}
        </span>
      ) : null}
    </button>
  );
}

function MessageBubble({
  message,
  currentUserId,
  senderLabel,
  showSender,
}: {
  message: ChatMessage;
  currentUserId: string;
  senderLabel?: string;
  showSender?: boolean;
}) {
  const own = message.sender_id === currentUserId;
  return (
    <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${own ? "bg-white text-zinc-950" : "bg-zinc-900 text-zinc-100"}`}>
        {showSender && !own ? (
          <span className="mb-0.5 block text-[11px] font-semibold text-emerald-300">{senderLabel || "Member"}</span>
        ) : null}
        {message.deleted_for_everyone_at ? (
          <span className="text-zinc-500">Message deleted</span>
        ) : message.missing_envelope ? (
          <span className={own ? "text-zinc-600" : "text-zinc-500"}>Message not available on this device</span>
        ) : message.decrypt_failed ? (
          <span className={own ? "text-zinc-600" : "text-zinc-500"}>Could not decrypt this message</span>
        ) : (
          <span className="whitespace-pre-wrap break-words">{message.decrypted_body || "Encrypted message"}</span>
        )}
        <span className={`mt-1 block text-[10px] ${own ? "text-zinc-500" : "text-zinc-600"}`}>{formatTime(message.created_at)}</span>
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
        {!invites.length ? <p className="p-6 text-sm text-zinc-500">No pending invites.</p> : null}
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
      await ensureChatDeviceRegistered();
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
            <button key={user.id} onClick={() => start(user)} className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-zinc-900">
              <Avatar user={{ id: user.id, name: user.name || user.username || "User", avatar_url: user.avatar_url }} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-white">@{user.username}</span>
                <span className="block truncate text-xs text-zinc-500">{user.headline || user.name}</span>
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
        {!requests.length ? <p className="p-6 text-sm text-zinc-500">No pending requests.</p> : null}
      </div>
    </div>
  );
}

function SettingsPanel({ userId, currentUsername, onUsernameUpdated }: { userId: string; currentUsername?: string | null; onUsernameUpdated: (username: string) => void }) {
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
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { user, refreshUser } = useAuth();
  const [mode, setMode] = useState<ViewMode>("inbox");
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [active, setActive] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [deviceReady, setDeviceReady] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socket = useChatSocket(Boolean(user && deviceReady));
  const activeIsGroup = active?.type === "group";
  const groupChat = useGroupChat(activeIsGroup ? active?.id || null : null);
  const syncGroupChat = groupChat.sync;
  const activeOtherUserId = useMemo(() => active?.other_user?.id, [active]);
  const activeId = active?.id || null;

  const activeRef = useRef<ChatConversation | null>(null);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const mergeConversation = useCallback((conversation: ChatConversation) => {
    const normalized = activeRef.current?.id === conversation.id
      ? { ...conversation, unread_count: 0 }
      : conversation;
    setConversations((prev) => {
      const exists = prev.some((item) => item.id === normalized.id);
      const next = exists
        ? prev.map((item) => (item.id === normalized.id ? { ...item, ...normalized } : item))
        : [normalized, ...prev];
      return [...next].sort((a, b) => {
        const aPinned = a.pinned_at ? 1 : 0;
        const bPinned = b.pinned_at ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return new Date(b.updated_at || b.last_message_at || 0).getTime() - new Date(a.updated_at || a.last_message_at || 0).getTime();
      });
    });
    setActive((current) => (current?.id === normalized.id ? { ...current, ...normalized } : current));
  }, []);

  const loadConversations = useCallback(async () => {
    const data = await listChatConversations();
    setConversations(data.conversations);
    setActive((current) => current ? data.conversations.find((conversation) => conversation.id === current.id) || current : data.conversations[0] || null);
  }, []);

  const loadMessages = useCallback(async (conversation: ChatConversation) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversation.id ? { ...c, unread_count: 0 } : c
      )
    );
    if (conversation.type === "group") {
      await syncGroupChat(conversation.id).catch(() => undefined);
    }
    const data = await listChatMessages(conversation.id);
    const decryptor = conversation.type === "group" ? decryptGroupMessage : decryptChatMessage;
    const decrypted = await Promise.all(data.messages.reverse().map((message) => decryptor(message as ChatMessage)));
    setMessages(decrypted);
    if (decrypted.length) await markChatRead(conversation.id, decrypted[decrypted.length - 1].id).catch(() => undefined);
  }, [syncGroupChat]);

  useEffect(() => {
    let cancelled = false;
    async function bootChat() {
      if (!user) {
        setDeviceReady(false);
        return;
      }
      try {
        await ensureChatDeviceRegistered();
        if (cancelled) return;
        setDeviceReady(true);
        await loadConversations();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not initialize encrypted chat");
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
          return [conversation.id, await decryptConversationPreview(conversation)] as const;
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
    socket.joinConversation(activeId);
    const timer = window.setTimeout(() => {
      loadMessages(conversation).catch((err) => setError(err.message));
    }, 0);
    return () => {
      window.clearTimeout(timer);
      socket.leaveConversation(activeId);
    };
  }, [activeId, loadMessages, socket]);

  useEffect(() => {
    const offNew = socket.on("message:new", async (payload) => {
      const incoming = payload as ChatMessage;
      const isGroupMessage = Boolean(incoming.group_payload);
      const message = isGroupMessage ? await decryptGroupMessage(incoming) : await decryptChatMessage(incoming);
      const isCurrentActive = activeRef.current?.id === message.conversation_id;

      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) return prev;
        if (message.client_message_id && prev.some((item) => item.client_message_id === message.client_message_id)) {
          return prev.map((item) => (item.client_message_id === message.client_message_id ? message : item));
        }
        return [...prev, message];
      });

      if (isCurrentActive) {
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
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function sendMessage() {
    if (!user || !active || !draft.trim()) return;
    const body = draft.trim();
    const client_message_id = crypto.randomUUID();
    setDraft("");
    setMessages((prev) => [...prev, {
      id: client_message_id,
      client_message_id,
      conversation_id: active.id,
      sender_id: user.id,
      message_type: "text",
      attachment_count: 0,
      encryption_version: activeIsGroup ? "group-senderkey-v1" : "webcrypto-v1",
      group_epoch_id: groupChat.currentEpoch?.epoch_id || null,
      created_at: new Date().toISOString(),
      envelopes: [],
      decrypted_body: body,
      pending: true,
    }]);

    try {
      await ensureChatDeviceRegistered();
      if (activeIsGroup) {
        const sent = await groupChat.sendGroupMessage(body, client_message_id);
        const decrypted = await decryptGroupMessage(sent);
        setMessages((prev) => prev.map((item) => (item.client_message_id === client_message_id ? decrypted : item)));
        setPreviews((prev) => ({ ...prev, [active.id]: body }));
        mergeConversation({
          ...active,
          last_message_id: sent.id,
          last_message_at: sent.created_at,
          updated_at: sent.created_at,
          last_message: sent,
          unread_count: 0,
        });
      } else {
        const conversationUserIds = activeOtherUserId ? [user.id, activeOtherUserId] : [user.id];
        const envelopes = await buildEncryptedMessageEnvelopes({ conversationUserIds, body });
        const data = await sendEncryptedChatMessage(active.id, {
          client_message_id,
          message_type: "text",
          encryption_version: "webcrypto-v1",
          envelopes,
        });
        const decrypted = await decryptChatMessage(data.message);
        setMessages((prev) => prev.map((item) => (item.client_message_id === client_message_id ? decrypted : item)));
        setPreviews((prev) => ({ ...prev, [active.id]: body }));
        mergeConversation({
          ...active,
          last_message_id: data.message.id,
          last_message_at: data.message.created_at,
          updated_at: data.message.created_at,
          last_message: data.message,
          unread_count: 0,
        });
      }
    } catch (err) {
      setMessages((prev) => prev.map((item) => (item.client_message_id === client_message_id ? { ...item, pending: false, failed: true } : item)));
      setError(err instanceof Error ? err.message : "Message failed");
    }
  }

  async function handleCreateGroup(input: { title: string; description?: string | null; member_user_ids: string[] }) {
    if (!user) return;
    setCreatingGroup(true);
    setError("");
    try {
      await ensureChatDeviceRegistered();
      const allTargets = Array.from(new Set([user.id, ...input.member_user_ids]));
      const { envelopes, epochKeyJwk } = await wrapGroupKeyForMembers("__pending__", 1, allTargets);
      const result = await createGroup({
        title: input.title,
        description: input.description,
        member_user_ids: input.member_user_ids,
        epoch_envelopes: envelopes,
      });
      const full = await getChatConversation(result.conversation.id);
      await loadConversations();
      setActive(full.conversation);
      // The device's own epoch-1 envelope will be imported by useGroupChat on the
      // next render once `active` switches to the new group. Belt-and-braces sync:
      void groupChat.sync(result.conversation.id).catch(() => undefined);
      void epochKeyJwk;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
      throw err;
    } finally {
      setCreatingGroup(false);
    }
  }

  if (!user) return <div className="p-6 text-sm text-zinc-400">Loading chat…</div>;

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="flex h-[calc(100vh-64px)] min-h-[680px] flex-col lg:flex-row">
        <aside className="w-full border-b border-zinc-900 lg:w-[360px] lg:border-b-0 lg:border-r">
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
                  loadConversations().catch(() => undefined);
                }}
              />
              <div className="max-h-[52vh] overflow-y-auto lg:max-h-none">
                {conversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    active={active?.id === conversation.id}
                    preview={previews[conversation.id]}
                    onSelect={() => { setActive(conversation); setShowGroupInfo(false); }}
                  />
                ))}
                {!conversations.length ? <p className="p-6 text-sm text-zinc-500">Search a username to start an encrypted DM or create a group.</p> : null}
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
            />
          )}
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          {active ? (
            <>
              <header className="flex items-center justify-between border-b border-zinc-900 px-5 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  {activeIsGroup ? (
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-800 text-sm font-semibold text-white">
                      {active.group?.title?.[0]?.toUpperCase() || <UsersIcon className="h-4 w-4" />}
                    </div>
                  ) : (
                    <Avatar user={active.other_user ? { id: active.other_user.id, name: active.other_user.name || active.other_user.username || "User", avatar_url: active.other_user.avatar_url } : null} size="md" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {activeIsGroup ? (active.group?.title || "Private group") : `@${active.other_user?.username || "user"}`}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-zinc-500">
                      <LockIcon className="h-3.5 w-3.5" /> {activeIsGroup ? `Encrypted group · ${groupChat.members.length || groupChat.syncing ? "syncing keys" : ""}`.trim() : "End-to-end encrypted"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  {activeIsGroup ? (
                    <button onClick={() => setShowGroupInfo((value) => !value)} className="flex items-center gap-1 rounded-lg border border-zinc-800 px-2 py-1 text-zinc-200 hover:bg-zinc-900">
                      <UsersIcon className="h-4 w-4" /> Info
                    </button>
                  ) : null}
                  <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                  Device ready
                </div>
              </header>
              {error ? <div className="border-b border-rose-950 bg-rose-950/30 px-5 py-2 text-sm text-rose-300">{error}</div> : null}
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    currentUserId={user.id}
                    showSender={activeIsGroup}
                    senderLabel={activeIsGroup ? (groupChat.members.find((member) => member.user_id === message.sender_id)?.user?.username || "Member") : undefined}
                  />
                ))}
                {!messages.length ? <p className="py-16 text-center text-sm text-zinc-500">No messages yet.</p> : null}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-zinc-900 p-4">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
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
                    className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-zinc-600"
                  />
                  <button
                    disabled={!draft.trim() || (activeIsGroup && !groupChat.currentEpoch)}
                    className="rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
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
  );
}
