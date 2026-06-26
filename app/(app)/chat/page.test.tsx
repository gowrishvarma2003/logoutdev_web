import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChatPage from "./page";
import { fetchUserCryptoProfile } from "@/lib/services/chatApi";

vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "user-1",
      name: "Deepak",
      email: "deepak@example.com",
      chat_encryption_enabled: false,
    },
    refreshUser: vi.fn(),
  }),
}));

vi.mock("@/lib/hooks/useChatSocket", () => ({
  useChatSocket: () => ({
    joinConversationWithAck: vi.fn(async () => undefined),
    leaveConversation: vi.fn(),
    on: vi.fn(() => vi.fn()),
    lastConnectedAt: null,
  }),
}));

vi.mock("@/lib/hooks/useGroupChat", () => ({
  useGroupChat: () => ({
    members: [],
    sync: vi.fn(async () => undefined),
  }),
}));

vi.mock("@/lib/chatCrypto", () => ({
  decryptChatMessage: vi.fn(async (message) => message),
  decryptGroupMessage: vi.fn(async (message) => message),
  encryptChatMessage: vi.fn(),
  getStoredVault: vi.fn(() => null),
  setupEncryptedChat: vi.fn(),
  restoreEncryptedChat: vi.fn(),
  resetEncryptedChat: vi.fn(),
  syncConversationKeys: vi.fn(),
  shareConversationKey: vi.fn(),
}));

vi.mock("@/lib/services/chatApi", () => ({
  createDirectConversation: vi.fn(),
  fetchUserCryptoProfile: vi.fn(),
  getChatConversation: vi.fn(),
  getChatSettings: vi.fn(),
  listChatConversations: vi.fn(async () => ({ conversations: [], next_cursor: null })),
  listChatMessages: vi.fn(async () => ({ messages: [], next_cursor: null })),
  listMessageRequests: vi.fn(async () => ({ requests: [], next_cursor: null })),
  markChatRead: vi.fn(),
  respondMessageRequest: vi.fn(),
  searchChatUsers: vi.fn(),
  sendEncryptedChatMessage: vi.fn(),
  updateChatSettings: vi.fn(),
  updateChatUsername: vi.fn(),
}));

vi.mock("@/lib/services/groupApi", () => ({
  createGroup: vi.fn(),
  listGroupInvites: vi.fn(async () => ({ invites: [] })),
  respondGroupInvite: vi.fn(),
}));

vi.mock("@/components/calls/CallProvider", () => ({
  CallErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CallProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ConversationCallControls: () => null,
  OngoingGroupCallBanner: () => null,
}));

vi.mock("@/components/chat/CreateGroupModal", () => ({ default: () => null }));
vi.mock("@/components/chat/GroupInfoPanel", () => ({ default: () => null }));

describe("ChatPage crypto boot", () => {
  beforeEach(() => {
    vi.mocked(fetchUserCryptoProfile).mockReset();
  });

  it("shows unlock instead of setup when the account already has a server crypto profile", async () => {
    vi.mocked(fetchUserCryptoProfile).mockResolvedValue({
      user_id: "user-1",
      account_public_wrapping_key: "{}",
      crypto_version: 2,
      backup_salt: "salt",
    });

    render(<ChatPage />);

    await waitFor(() => expect(screen.getByText("Unlock Your Secure Chats")).toBeInTheDocument());
    expect(screen.queryByText("Enable End-to-End Encryption")).not.toBeInTheDocument();
  });
});
