"use client";

import { useEffect, useMemo, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/apiBaseUrl";
import { getCurrentChatDeviceId } from "@/lib/chatCrypto";

export function useChatSocket(enabled = true) {
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Array<{ event: string; handler: (...args: unknown[]) => void }>>([]);
  const joinedConversationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const token = localStorage.getItem("authToken");
    if (!token) return;

    const socket = io(API_BASE_URL, {
      path: "/socket.io",
      auth: {
        token,
        device_id: getCurrentChatDeviceId(),
      },
      transports: ["websocket"],
      reconnectionDelay: 750,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
    socketRef.current = socket;
    listenersRef.current.forEach(({ event, handler }) => socket.on(event, handler));

    socket.on("connect", () => {
      joinedConversationsRef.current.forEach((conversationId) => {
        socket.emit("conversation:join", { conversation_id: conversationId });
      });
    });

    const heartbeat = window.setInterval(() => {
      socket.emit("presence:heartbeat");
    }, 30000);

    return () => {
      window.clearInterval(heartbeat);
      listenersRef.current.forEach(({ event, handler }) => socket.off(event, handler));
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);

  return useMemo(
    () => ({
      joinConversation(conversationId: string) {
        joinedConversationsRef.current.add(conversationId);
        socketRef.current?.emit("conversation:join", { conversation_id: conversationId });
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
    }),
    []
  );
}
