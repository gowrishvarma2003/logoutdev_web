import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatSocketApi } from "@/lib/hooks/useChatSocket";
import type { ChatConversation, User } from "@/lib/types";
import { CallProvider, NetworkQualityIndicator, useCalls } from "./CallProvider";

vi.mock("@/lib/chatCrypto", () => ({ getCurrentChatDeviceId: () => "device-1" }));
vi.mock("@/lib/calls/webrtcService", () => ({
  addLocalTracks: vi.fn(),
  createPeerConnection: vi.fn(() => ({ close: vi.fn() })),
  getLocalMedia: vi.fn(() => new Promise(() => undefined)),
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

describe("CallProvider calling UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
