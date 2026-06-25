import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChatSocket } from "./useChatSocket";

const socketMock = vi.hoisted(() => {
  const events = new Map<string, Array<(...args: unknown[]) => void>>();
  const managerEvents = new Map<string, Array<(...args: unknown[]) => void>>();
  const socket = {
    connected: false,
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      const list = events.get(event) || [];
      list.push(handler);
      events.set(event, list);
      return socket;
    }),
    off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      events.set(event, (events.get(event) || []).filter((item) => item !== handler));
      return socket;
    }),
    emit: vi.fn(),
    timeout: vi.fn(() => ({
      emit: vi.fn((_event: string, _payload: unknown, ack?: (error: Error | null, response?: { ok: boolean }) => void) => {
        ack?.(null, { ok: true });
      }),
    })),
    disconnect: vi.fn(),
    io: {
      on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        const list = managerEvents.get(event) || [];
        list.push(handler);
        managerEvents.set(event, list);
      }),
    },
  };
  return {
    events,
    io: vi.fn(() => socket),
    managerEvents,
    socket,
  };
});

vi.mock("socket.io-client", () => ({ io: socketMock.io }));
vi.mock("@/lib/chatCrypto", () => ({ getCurrentChatDeviceId: () => "device-1" }));

function trigger(event: string, ...args: unknown[]) {
  for (const handler of socketMock.events.get(event) || []) handler(...args);
}

describe("useChatSocket", () => {
  beforeEach(() => {
    localStorage.setItem("authToken", "token-1");
    socketMock.events.clear();
    socketMock.managerEvents.clear();
    socketMock.io.mockClear();
    socketMock.socket.connected = false;
    socketMock.socket.on.mockClear();
    socketMock.socket.off.mockClear();
    socketMock.socket.emit.mockClear();
    socketMock.socket.timeout.mockClear();
    socketMock.socket.disconnect.mockClear();
    socketMock.socket.io.on.mockClear();
  });

  it("starts with websocket and keeps polling as a fallback", () => {
    renderHook(() => useChatSocket(true));

    expect(socketMock.io).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      transports: ["websocket", "polling"],
      tryAllTransports: true,
      rememberUpgrade: true,
    }));
  });

  it("rejoins remembered conversations after reconnect", async () => {
    const { result } = renderHook(() => useChatSocket(true));

    act(() => {
      result.current.joinConversation("conversation-1");
      socketMock.socket.connected = true;
      trigger("connect");
    });

    await waitFor(() => expect(result.current.status).toBe("connected"));
    expect(socketMock.socket.timeout).toHaveBeenCalled();
  });
});
