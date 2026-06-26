import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMocks = vi.hoisted(() => ({
  setupChatCrypto: vi.fn(),
  getChatCryptoBackup: vi.fn(),
  updateChatCryptoBackup: vi.fn(),
  fetchUserCryptoProfile: vi.fn(),
  resetChatCrypto: vi.fn(),
  createConversationKeyShares: vi.fn(),
  fetchConversationKeyShares: vi.fn(),
}));

vi.mock("./services/chatApi", () => apiMocks);

import {
  clearStoredVault,
  computeConversationKeyCommitment,
  setStoredVault,
  syncConversationKeys,
  type KeyVault,
} from "./chatCrypto";

describe("chat crypto key recovery", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearStoredVault();
    vi.clearAllMocks();
  });

  it("does not create a replacement key when an existing remote epoch cannot be decrypted", async () => {
    const vault: KeyVault = {
      account_master_key: "master",
      account_public_wrapping_key: "{}",
      account_private_wrapping_key: {},
      conversation_keys: {},
      created_at: "2026-06-26T00:00:00.000Z",
      updated_at: "2026-06-26T00:00:00.000Z",
      backup_salt: "salt",
    };
    setStoredVault(vault);

    apiMocks.fetchConversationKeyShares.mockResolvedValue({
      keyShares: [{
        epoch_id: "epoch-1",
        epoch_number: 1,
        encrypted_conversation_key: "not-json-base64",
        key_commitment: "sha256:original",
      }],
      epochs: [{
        id: "epoch-1",
        epoch_number: 1,
        key_commitment: "sha256:original",
      }],
    });

    await expect(syncConversationKeys("conversation-1", ["user-1", "user-2"])).rejects.toThrow(/could not recover/i);
    expect(apiMocks.createConversationKeyShares).not.toHaveBeenCalled();
  });

  it("computes stable commitments for the same exported conversation key", async () => {
    const keyJwk: JsonWebKey = { kty: "oct", k: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", alg: "A256GCM", ext: true };

    await expect(computeConversationKeyCommitment(keyJwk)).resolves.toEqual(
      await computeConversationKeyCommitment({ ...keyJwk })
    );
  });
});
