import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as webrtc from "@/lib/calls/webrtcService";
import type { ChatSocketApi } from "@/lib/hooks/useChatSocket";
import type { CallRecord, ChatConversation, User } from "@/lib/types";
import { buildCallTiles, CallProvider, NetworkQualityIndicator, selectPinnedTileId, useCalls, type CallTile } from "./CallProvider";

vi.mock("@/lib/chatCrypto", () => ({ getCurrentChatDeviceId: () => "device-1" }));
vi.mock("@/lib/calls/webrtcService", () => ({
  addLocalTracks: vi.fn(),
  addIceCandidate: vi.fn(),
  createOffer: vi.fn().mockResolvedValue({ type: "offer", sdp: "offer-sdp" }),
  createPeerConnection: vi.fn(() => ({ close: vi.fn() })),
  getLocalMedia: vi.fn(() => new Promise(() => undefined)),
  handleAnswer: vi.fn().mockResolvedValue(true),
  handleOffer: vi.fn().mockResolvedValue({ type: "answer", sdp: "answer-sdp" }),
  stopLocalMedia: vi.fn(),
}));
vi.mock("@/lib/calls/sfuService", () => ({
  leaveRoom: vi.fn(),
}));
vi.mock("@/lib/services/callApi", () => ({
  getActiveCall: vi.fn().mockResolvedValue({ call: null }),
  getCallConfig: vi.fn().mockResolvedValue({ config: { rtc: { iceServers: [] } } }),
  leaveCall: vi.fn().mockResolvedValue({ call: null }),
  rejectCall: vi.fn().mockResolvedValue({ call: null }),
  startDirectCall: vi.fn(() => new Promise(() => undefined)),
}));

const user: User = {
  id: "user-1",
  email: "user@example.com",
  name: "User",
  created_at: "2026-06-24T00:00:00.000Z",
};

const conversation = {
  id: "conversation-1",
  type: "direct",
  status: "active",
  created_at: "2026-06-24T00:00:00.000Z",
  updated_at: "2026-06-24T00:00:00.000Z",
  unread_count: 0,
  other_user: { id: "user-2", username: "builder", name: "Builder" },
} as ChatConversation;

const socket = {
  emit: vi.fn(),
  connected: () => true,
  joinCallRoom: vi.fn(),
  joinCallRoomWithAck: vi.fn(),
  joinConversation: vi.fn(),
  joinConversationWithAck: vi.fn(),
  leaveCallRoom: vi.fn(),
  leaveConversation: vi.fn(),
  emitTyping: vi.fn(),
  emitWithAck: vi.fn(),
  on: vi.fn(() => vi.fn()),
  status: "connected",
  lastConnectedAt: Date.now(),
} as ChatSocketApi;

function createSocketMock() {
  const handlers: Record<string, (payload?: unknown) => unknown> = {};
  const socketMock = {
    emit: vi.fn(),
    connected: () => true,
    joinCallRoom: vi.fn(),
    joinCallRoomWithAck: vi.fn(),
    joinConversation: vi.fn(),
    joinConversationWithAck: vi.fn(),
    leaveCallRoom: vi.fn(),
    leaveConversation: vi.fn(),
    emitTyping: vi.fn(),
    emitWithAck: vi.fn(),
    on: vi.fn((event: string, handler: (payload?: unknown) => unknown) => {
      handlers[event] = handler;
      return () => {
        delete handlers[event];
      };
    }),
    status: "connected",
    lastConnectedAt: Date.now(),
  } as unknown as ChatSocketApi;

  return { socket: socketMock, handlers };
}

function mockMediaStream({ audio = 0, video = 0 }: { audio?: number; video?: number } = {}) {
  return {
    getAudioTracks: () => Array.from({ length: audio }, (_, index) => ({ id: `audio-${index}`, enabled: true, readyState: "live" })),
    getVideoTracks: () => Array.from({ length: video }, (_, index) => ({ id: `video-${index}`, enabled: true, readyState: "live" })),
  } as unknown as MediaStream;
}

function directCall(overrides: Partial<CallRecord> = {}) {
  return {
    id: "call-1",
    conversation_id: "conversation-1",
    call_type: "direct_video",
    call_mode: "direct",
    status: "accepted",
    created_by: "user-1",
    sfu_room_id: "logoutdev-call-1",
    created_at: "2026-06-24T00:00:00.000Z",
    updated_at: "2026-06-24T00:00:00.000Z",
    participants: [
      {
        id: "participant-1",
        call_id: "call-1",
        user_id: "user-1",
        status: "joined",
        is_muted: false,
        is_camera_off: false,
        is_screen_sharing: false,
        created_at: "2026-06-24T00:00:00.000Z",
        updated_at: "2026-06-24T00:00:00.000Z",
      },
      {
        id: "participant-2",
        call_id: "call-1",
        user_id: "user-2",
        status: "joined",
        is_muted: false,
        is_camera_off: false,
        is_screen_sharing: false,
        created_at: "2026-06-24T00:00:00.000Z",
        updated_at: "2026-06-24T00:00:00.000Z",
        user: { id: "user-2", name: "Builder", username: "builder" },
      },
    ],
    current_user_participant: null,
    ...overrides,
  } as CallRecord;
}

function StartCallButton() {
  const calls = useCalls();
  return <button onClick={() => void calls.startDirectCall(conversation, "audio")}>Start audio</button>;
}

describe("NetworkQualityIndicator", () => {
  it("renders a readable connected state", () => {
    render(<NetworkQualityIndicator state="connected" />);
    expect(screen.getByText("connected")).toBeInTheDocument();
  });

  it("renders reconnecting state for degraded calls", () => {
    render(<NetworkQualityIndicator state="reconnecting" />);
    expect(screen.getByText("reconnecting")).toBeInTheDocument();
  });
});

describe("call tile model", () => {
  const call = {
    id: "call-1",
    conversation_id: "conversation-1",
    call_type: "group_video",
    call_mode: "group",
    status: "ongoing",
    created_by: "user-1",
    created_at: "2026-06-24T00:00:00.000Z",
    updated_at: "2026-06-24T00:00:00.000Z",
    participants: [
      {
        id: "participant-1",
        call_id: "call-1",
        user_id: "user-1",
        status: "joined",
        is_muted: false,
        is_camera_off: false,
        is_screen_sharing: true,
        created_at: "2026-06-24T00:00:00.000Z",
        updated_at: "2026-06-24T00:00:00.000Z",
      },
      {
        id: "participant-2",
        call_id: "call-1",
        user_id: "user-2",
        status: "joined",
        is_muted: true,
        is_camera_off: false,
        is_screen_sharing: true,
        created_at: "2026-06-24T00:00:00.000Z",
        updated_at: "2026-06-24T00:00:00.000Z",
        user: { id: "user-2", name: "Builder", username: "builder" },
      },
    ],
    current_user_participant: null,
  } as const;

  it("builds separate local camera, local screen, and remote screen tiles", () => {
    const remoteScreen = mockMediaStream();
    const remoteTrackTiles: Record<string, CallTile> = {
      "user-2:screen": {
        id: "user-2:screen",
        participantId: "participant-2",
        userId: "user-2",
        label: "@builder's screen",
        kind: "screen",
        stream: remoteScreen,
        isLocal: false,
        isMuted: true,
        isCameraOff: false,
        isScreenSharing: true,
        status: "joined",
      },
    };

    const tiles = buildCallTiles({
      call,
      currentUserId: "user-1",
      localStream: mockMediaStream({ audio: 1, video: 1 }),
      localScreenStream: mockMediaStream(),
      remoteStreams: {},
      remoteTrackTiles,
    });

    expect(tiles.map((tile) => tile.id)).toEqual(["local-camera", "local-screen", "user-2:screen"]);
    expect(tiles.find((tile) => tile.id === "local-screen")?.label).toBe("Your screen");
    expect(tiles.find((tile) => tile.id === "user-2:screen")?.isMuted).toBe(true);
    expect(tiles.find((tile) => tile.id === "local-camera")?.isMuted).toBe(false);
  });

  it("auto-pins screen share unless a manual pin or grid layout is active", () => {
    const tiles = [
      { id: "local-camera", kind: "camera" },
      { id: "remote-screen", kind: "screen" },
      { id: "remote-camera", kind: "camera" },
    ] as CallTile[];

    expect(selectPinnedTileId(tiles, null)).toBe("remote-screen");
    expect(selectPinnedTileId(tiles, "remote-camera")).toBe("remote-camera");
    expect(selectPinnedTileId(tiles, null, true)).toBeNull();
  });
});

describe("CallProvider calling UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLMediaElement.prototype, "play", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("shows the full call screen immediately while startup work is pending", async () => {
    render(
      <CallProvider user={user} socket={socket}>
        <StartCallButton />
      </CallProvider>
    );

    fireEvent.click(screen.getByText("Start audio"));

    expect(await screen.findByText("Direct call")).toBeInTheDocument();
    expect(screen.getAllByText(/Starting call|Allow microphone access|Setting up secure media/).length).toBeGreaterThan(0);
    expect(screen.getByTitle("Cancel call")).toBeInTheDocument();
  });

  it("lets users cancel while startup work is pending", async () => {
    render(
      <CallProvider user={user} socket={socket}>
        <StartCallButton />
      </CallProvider>
    );

    fireEvent.click(screen.getByText("Start audio"));
    fireEvent.click(await screen.findByTitle("Cancel call"));

    await waitFor(() => expect(screen.queryByText("Direct call")).not.toBeInTheDocument());
  });

  it("does not start legacy peer audio after an SFU direct video call is accepted", async () => {
    const { socket: socketMock, handlers } = createSocketMock();
    render(
      <CallProvider user={user} socket={socketMock}>
        <div />
      </CallProvider>
    );

    await waitFor(() => expect(handlers["call:accepted"]).toBeTypeOf("function"));

    await act(async () => {
      await handlers["call:accepted"]({ call: directCall() });
    });

    expect(webrtc.createPeerConnection).not.toHaveBeenCalled();
    expect(webrtc.createOffer).not.toHaveBeenCalled();
  });

  it("keeps the legacy peer path available for non-SFU direct audio calls", async () => {
    const { socket: socketMock, handlers } = createSocketMock();
    vi.mocked(webrtc.getLocalMedia).mockResolvedValueOnce(mockMediaStream({ audio: 1 }));
    render(
      <CallProvider user={user} socket={socketMock}>
        <div />
      </CallProvider>
    );

    await waitFor(() => expect(handlers["call:accepted"]).toBeTypeOf("function"));

    await act(async () => {
      await handlers["call:accepted"]({
        call: directCall({
          call_type: "direct_audio",
          sfu_room_id: null,
        }),
      });
    });

    expect(webrtc.createPeerConnection).toHaveBeenCalledTimes(1);
    expect(webrtc.createOffer).toHaveBeenCalledTimes(1);
  });
});
