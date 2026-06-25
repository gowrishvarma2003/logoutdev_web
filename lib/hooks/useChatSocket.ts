"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { getCurrentChatDeviceId } from "@/lib/chatCrypto";

export type SocketStatus = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "failed";

interface SocketAck {
  ok?: boolean;
  error?: string;
}

const ROOM_ACK_TIMEOUT_MS = 4000;

export function useChatSocket(enabled = true) {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Array<{ event: string; handler: (...args: unknown[]) => void }>>([]);
  const joinedConversationsRef = useRef<Set<string>>(new Set());
  const joinedCallsRef = useRef<Set<string>>(new Set());
  const [status, setStatus] = useState<SocketStatus>(enabled ? "connecting" : "idle");
  const [lastConnectedAt, setLastConnectedAt] = useState<number | null>(null);
  const statusRef = useRef<SocketStatus>(status);
  const lastConnectedAtRef = useRef<number | null>(lastConnectedAt);

  statusRef.current = status;
  lastConnectedAtRef.current = lastConnectedAt;

  const emitWithAck = useCallback((event: string, payload?: Record<string, unknown>, timeoutMs = ROOM_ACK_TIMEOUT_MS) => {
    const socket = socketRef.current;
    if (!socket) return Promise.resolve<SocketAck>({ ok: false, error: "Socket is not connected." });
    return new Promise<SocketAck>((resolve) => {
      socket.timeout(timeoutMs).emit(event, payload, (err: Error | null, response?: SocketAck) => {
        if (err) {
          resolve({ ok: false, error: err.message || "Socket acknowledgement timed out." });
          return;
        }
        resolve(response || { ok: true });
      });
    });
  }, []);

  const joinConversationRoom = useCallback(async (conversationId: string) => {
    joinedConversationsRef.current.add(conversationId);
    if (!socketRef.current?.connected) return { ok: false, error: "Socket is offline." };
    return emitWithAck("conversation:join", { conversation_id: conversationId });
  }, [emitWithAck]);

  const joinCallRoom = useCallback(async (callId: string) => {
    joinedCallsRef.current.add(callId);
    if (!socketRef.current?.connected) return { ok: false, error: "Socket is offline." };
    return emitWithAck("call:join-room", { call_id: callId });
  }, [emitWithAck]);

  const rejoinRooms = useCallback(() => {
    joinedConversationsRef.current.forEach((conversationId) => {
      void joinConversationRoom(conversationId);
    });
    joinedCallsRef.current.forEach((callId) => {
      void joinCallRoom(callId);
    });
  }, [joinCallRoom, joinConversationRoom]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setStatus("idle");
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) {
      setStatus("idle");
      return;
    }

    setStatus("connecting");
    const socket = io(API_BASE_URL, {
      path: "/socket.io",
      auth: {
        token,
        device_id: getCurrentChatDeviceId(),
      },
      // Try WebSocket first for speed, but fall back to polling on networks
      // where direct websocket handshakes are unreliable.
      transports: ["websocket", "polling"],
      tryAllTransports: true,
      rememberUpgrade: true,
      reconnectionDelay: 200,
      reconnectionDelayMax: 3000,
      reconnectionAttempts: 10,
      timeout: 8000,
      forceNew: false,
    });
    socketRef.current = socket;
    listenersRef.current.forEach(({ event, handler }) => socket.on(event, handler));

    socket.on("connect", () => {
      setStatus("connected");
      setLastConnectedAt(Date.now());
      rejoinRooms();
    });

    socket.on("connect_error", (err) => {
      setStatus("reconnecting");
      console.warn("[ChatSocket] Connection error:", err.message);
    });

    socket.io.on("reconnect_attempt", () => {
      setStatus("reconnecting");
    });

    socket.on("reconnect", (attempt) => {
      setStatus("connected");
      setLastConnectedAt(Date.now());
      console.info(`[ChatSocket] Reconnected after ${attempt} attempt(s)`);
    });

    socket.on("reconnect_failed", () => {
      setStatus("failed");
      console.error("[ChatSocket] Failed to reconnect after all attempts");
    });

    socket.on("disconnect", () => {
      setStatus("disconnected");
    });

    const heartbeat = window.setInterval(() => {
      if (socket.connected) socket.emit("presence:heartbeat");
    }, 30000);

    return () => {
      window.clearInterval(heartbeat);
      listenersRef.current.forEach(({ event, handler }) => socket.off(event, handler));
      socket.disconnect();
      socketRef.current = null;
      setStatus("idle");
    };
  }, [enabled, rejoinRooms]);

  return useMemo(
    () => ({
      get status() {
        return statusRef.current;
      },
      get lastConnectedAt() {
        return lastConnectedAtRef.current;
      },
      joinConversation(conversationId: string) {
        void joinConversationRoom(conversationId);
      },
      joinConversationWithAck(conversationId: string) {
        return joinConversationRoom(conversationId);
      },
      leaveConversation(conversationId: string) {
        joinedConversationsRef.current.delete(conversationId);
        socketRef.current?.emit("conversation:leave", { conversation_id: conversationId });
      },
      on(event: string, handler: (...args: unknown[]) => void) {
        listenersRef.current.push({ event, handler });
        socketRef.current?.on(event, handler);
        return () => {
          listenersRef.current = listenersRef.current.filter((item) => item.event !== event || item.handler !== handler);
          socketRef.current?.off(event, handler);
        };
      },
      emitTyping(conversationId: string, active: boolean) {
        socketRef.current?.emit(active ? "typing:start" : "typing:stop", { conversation_id: conversationId });
      },
      joinCallRoom(callId: string) {
        void joinCallRoom(callId);
      },
      joinCallRoomWithAck(callId: string) {
        return joinCallRoom(callId);
      },
      leaveCallRoom(callId: string) {
        joinedCallsRef.current.delete(callId);
        socketRef.current?.emit("call:leave-room", { call_id: callId });
      },
      emit(event: string, payload?: Record<string, unknown>, ack?: (response: unknown) => void) {
        socketRef.current?.emit(event, payload, ack);
      },
      emitWithAck,
      connected() {
        return Boolean(socketRef.current?.connected);
      },
    }),
    [emitWithAck, joinCallRoom, joinConversationRoom]
  );
}

export type ChatSocketApi = ReturnType<typeof useChatSocket>;
