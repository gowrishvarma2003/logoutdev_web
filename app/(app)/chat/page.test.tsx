import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChatPage from "./page";
import {
  completeEncryptedAttachment,
  fetchUserCryptoProfile,
  listChatConversations,
  listChatMessages,
  sendEncryptedChatMessage,
  updateChatConversationPin,
  uploadEncryptedAttachmentBlob,
} from "@/lib/services/chatApi";
import { encryptAttachment, encryptChatMessage, getStoredVault, syncConversationKeys } from "@/lib/chatCrypto";

const socketMock = vi.hoisted(() => ({
  joinConversationWithAck: vi.fn(async () => undefined),
  leaveConversation: vi.fn(),
  on: vi.fn(() => vi.fn()),
  emitTyping: vi.fn(),
  lastConnectedAt: null,
}));

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
  useChatSocket: () => socketMock,
}));

vi.mock("@/lib/hooks/useGroupChat", () => ({
  useGroupChat: () => ({
    members: [],
    currentEpoch: 1,
    syncing: false,
    sync: vi.fn(async () => undefined),
  }),
}));

vi.mock("@/lib/chatCrypto", () => ({
  decryptAttachment: vi.fn(),
  decryptChatMessage: vi.fn(async (message) => message),
  decryptGroupMessage: vi.fn(async (message) => message),
  encryptChatMessage: vi.fn(),
  encryptAttachment: vi.fn(),
  getStoredVault: vi.fn(() => null),
  setupEncryptedChat: vi.fn(),
  restoreEncryptedChat: vi.fn(),
  resetEncryptedChat: vi.fn(),
  syncConversationKeys: vi.fn(),
  shareConversationKey: vi.fn(),
}));

vi.mock("@/lib/services/chatApi", () => ({
  completeEncryptedAttachment: vi.fn(),
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
  updateChatConversationPin: vi.fn(),
  uploadEncryptedAttachmentBlob: vi.fn(),
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

const directConversation = {
  id: "c1",
  type: "direct" as const,
  status: "active",
  last_message_id: "m1",
  last_message_at: "2026-07-01T10:00:00.000Z",
  updated_at: "2026-07-01T10:00:00.000Z",
  unread_count: 0,
  pinned_at: null,
  other_user: {
    id: "user-2",
    name: "Anaya",
    username: "anaya",
    avatar_url: null,
    presence_status: "offline" as const,
    last_seen_visible: true,
    last_seen_at: "2026-07-01T09:55:00.000Z",
    chat_encryption_enabled: true,
  },
  last_message: null,
};

describe("ChatPage crypto boot", () => {
  beforeEach(() => {
    vi.mocked(fetchUserCryptoProfile).mockReset();
    vi.mocked(getStoredVault).mockReset().mockReturnValue(null);
    vi.mocked(listChatConversations).mockReset().mockResolvedValue({ conversations: [], next_cursor: null });
    vi.mocked(listChatMessages).mockReset().mockResolvedValue({ messages: [], next_cursor: null });
    vi.mocked(updateChatConversationPin).mockReset().mockResolvedValue({ participant: {} });
    vi.mocked(encryptChatMessage).mockReset();
    vi.mocked(encryptAttachment).mockReset();
    vi.mocked(syncConversationKeys).mockReset().mockResolvedValue(1);
    vi.mocked(uploadEncryptedAttachmentBlob).mockReset();
    vi.mocked(completeEncryptedAttachment).mockReset();
    vi.mocked(sendEncryptedChatMessage).mockReset();
    vi.stubGlobal("fetch", vi.fn());
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

  it("shows message loading before the empty state", async () => {
    vi.mocked(getStoredVault).mockReturnValue({ conversation_keys: {} });
    vi.mocked(listChatConversations).mockResolvedValue({ conversations: [directConversation], next_cursor: null });
    let resolveMessages: (value: { messages: []; next_cursor: null }) => void = () => {};
    vi.mocked(listChatMessages).mockReturnValue(new Promise((resolve) => {
      resolveMessages = resolve;
    }));

    render(<ChatPage />);

    await waitFor(() => expect(screen.getByText("Loading messages...")).toBeInTheDocument());
    expect(screen.queryByText("No messages yet")).not.toBeInTheDocument();
    resolveMessages({ messages: [], next_cursor: null });
    await waitFor(() => expect(screen.getByText("No messages yet")).toBeInTheDocument());
  });

  it("links direct chat header to the user profile and shows last seen", async () => {
    vi.mocked(getStoredVault).mockReturnValue({ conversation_keys: {} });
    vi.mocked(listChatConversations).mockResolvedValue({ conversations: [directConversation], next_cursor: null });

    render(<ChatPage />);

    const link = await screen.findByRole("link", { name: /anaya/i });
    expect(link).toHaveAttribute("href", "/profile/anaya");
    expect(screen.getByText(/last seen/i)).toBeInTheDocument();
    expect(screen.queryByText(/End-to-end encrypted/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Device ready/i)).not.toBeInTheDocument();
  });

  it("pins chats through the pin API", async () => {
    vi.mocked(getStoredVault).mockReturnValue({ conversation_keys: {} });
    vi.mocked(listChatConversations).mockResolvedValue({ conversations: [directConversation], next_cursor: null });

    render(<ChatPage />);

    fireEvent.click(await screen.findByLabelText("Chat options"));
    fireEvent.click(await screen.findByRole("button", { name: "Pin chat" }));

    await waitFor(() => expect(updateChatConversationPin).toHaveBeenCalledWith("c1", true));
  });

  it("sends normal text without empty attachment ids", async () => {
    vi.mocked(getStoredVault).mockReturnValue({ conversation_keys: { c1: { 1: { key_jwk: {}, epoch_id: "epoch-1" } } } });
    vi.mocked(listChatConversations).mockResolvedValue({ conversations: [directConversation], next_cursor: null });
    vi.mocked(encryptChatMessage).mockResolvedValue({
      encryption_version: "webcrypto-v2",
      ciphertext: "ciphertext",
      nonce_or_iv: "iv",
      key_epoch_id: "epoch-1",
    });
    vi.mocked(sendEncryptedChatMessage).mockResolvedValue({
      message: {
        id: "m-text",
        client_message_id: "client-text",
        conversation_id: "c1",
        sender_id: "user-1",
        message_type: "text",
        attachment_count: 0,
        encryption_version: "webcrypto-v2",
        ciphertext: "ciphertext",
        nonce_or_iv: "iv",
        key_epoch_id: "epoch-1",
        created_at: new Date().toISOString(),
        envelopes: [],
        attachments: [],
      },
    });

    render(<ChatPage />);

    fireEvent.change(await screen.findByPlaceholderText("Write an encrypted message"), { target: { value: "hello" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(sendEncryptedChatMessage).toHaveBeenCalled());
    const [, payload] = vi.mocked(sendEncryptedChatMessage).mock.calls[0];
    expect(payload).toMatchObject({ message_type: "text", attachment_count: 0 });
    expect(payload).not.toHaveProperty("attachment_ids");
  });

  it("encrypts, uploads, completes, and sends an attachment", async () => {
    vi.mocked(getStoredVault).mockReturnValue({ conversation_keys: { c1: { 1: { key_jwk: {}, epoch_id: "epoch-1" } } } });
    vi.mocked(listChatConversations).mockResolvedValue({ conversations: [directConversation], next_cursor: null });
    vi.mocked(encryptAttachment).mockResolvedValue({
      encryptedBlob: new Blob(["encrypted"], { type: "application/octet-stream" }),
      encrypted_metadata: "{\"name\":\"note.txt\"}",
    });
    vi.mocked(uploadEncryptedAttachmentBlob).mockResolvedValue({
      storage_key: "chat/key",
      size_bytes: 9,
      max_size_bytes: 1000,
    });
    vi.mocked(completeEncryptedAttachment).mockResolvedValue({ attachment: { id: "a1" } });
    vi.mocked(encryptChatMessage).mockResolvedValue({
      encryption_version: "webcrypto-v2",
      ciphertext: "cipher",
      nonce_or_iv: "iv",
      key_epoch_id: "epoch-1",
    });
    vi.mocked(sendEncryptedChatMessage).mockResolvedValue({
      message: {
        id: "m2",
        client_message_id: "client",
        conversation_id: "c1",
        sender_id: "user-1",
        message_type: "attachment",
        attachment_count: 1,
        encryption_version: "webcrypto-v2",
        ciphertext: "cipher",
        nonce_or_iv: "iv",
        key_epoch_id: "epoch-1",
        created_at: new Date().toISOString(),
        envelopes: [],
        attachments: [],
      },
    });
    const { container } = render(<ChatPage />);

    const input = await waitFor(() => {
      const element = container.querySelector("input[type='file']") as HTMLInputElement | null;
      expect(element).not.toBeNull();
      return element as HTMLInputElement;
    });
    fireEvent.change(input, { target: { files: [new File(["hello"], "note.txt", { type: "text/plain" })] } });
    await screen.findByText("Ready to send");
    expect(uploadEncryptedAttachmentBlob).not.toHaveBeenCalled();
    expect(completeEncryptedAttachment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(sendEncryptedChatMessage).toHaveBeenCalledWith("c1", expect.objectContaining({
      message_type: "attachment",
      attachment_ids: ["a1"],
      attachment_count: 1,
    })));
    expect(uploadEncryptedAttachmentBlob).toHaveBeenCalledTimes(1);
  });
});
