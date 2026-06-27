import {
  setupChatCrypto,
  getChatCryptoBackup,
  updateChatCryptoBackup,
  fetchUserCryptoProfile,
  resetChatCrypto,
  createConversationKeyShares,
  fetchConversationKeyShares,
} from "./services/chatApi";
import type { ChatMessage } from "./types";

const VAULT_KEY = "logoutdev.chat.vault.v2";
const SESSION_RECOVERY_KEY = "logoutdev.chat.recovery-key";

export interface KeyVault {
  account_master_key: string;
  account_public_wrapping_key: string; // stringified JWK
  account_private_wrapping_key: JsonWebKey;
  conversation_keys: Record<string, Record<number, { key_jwk: JsonWebKey; epoch_id: string; key_commitment?: string | null }>>;
  created_at: string;
  updated_at: string;
  backup_salt?: string;
}

interface RemoteKeyEpoch {
  id: string;
  epoch_number: number;
  key_commitment?: string | null;
}

interface RemoteKeyShare {
  epoch_id: string;
  epoch_number?: number;
  encrypted_conversation_key: string;
  key_commitment?: string | null;
}

interface UserCryptoProfileData {
  account_public_wrapping_key: string;
  backup_salt?: string;
}

interface SyncConversationKeyOptions {
  allowCreate?: boolean;
  allowRepair?: boolean;
}

// Memory cache of decrypted vault
let cachedVault: KeyVault | null = null;

// ─── Performance Caches ────────────────────────────────────────────────────────
// Cache crypto profiles so repeated sends to the same user don't re-fetch
const _cryptoProfileCache = new Map<string, { data: UserCryptoProfileData; ts: number }>();
const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Track when we last synced key-shares per conversation to avoid re-fetching
// on every message send. We still always fetch if the vault has no key yet.
const _keyShareSyncTs = new Map<string, number>();
const KEY_SHARE_SYNC_TTL_MS = 2 * 60 * 1000; // 2 minutes
const _keyShareRepairTs = new Map<string, number>();
const KEY_SHARE_REPAIR_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchUserCryptoProfileCached(userId: string): Promise<UserCryptoProfileData> {
  const hit = _cryptoProfileCache.get(userId);
  if (hit && Date.now() - hit.ts < PROFILE_CACHE_TTL_MS) return hit.data;
  const data = await fetchUserCryptoProfile(userId) as UserCryptoProfileData;
  _cryptoProfileCache.set(userId, { data, ts: Date.now() });
  return data;
}

function bytesToBase64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  view.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function encodeText(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function decodeText(value: ArrayBuffer | Uint8Array): string {
  return new TextDecoder().decode(value);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function bytesToHex(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(view).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function computeConversationKeyCommitment(keyJwk: JsonWebKey): Promise<string> {
  const keyMaterial = typeof keyJwk.k === "string" ? keyJwk.k : JSON.stringify(keyJwk);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    toArrayBuffer(encodeText(`logoutdev-chat-key-v1:${keyMaterial}`))
  );
  return `sha256:${bytesToHex(digest)}`;
}

async function ensureStoredKeyCommitment(stored: { key_jwk: JsonWebKey; key_commitment?: string | null }) {
  if (!stored.key_commitment) {
    stored.key_commitment = await computeConversationKeyCommitment(stored.key_jwk);
  }
  return stored.key_commitment;
}

export function getStoredVault(): KeyVault | null {
  if (cachedVault) return cachedVault;
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(VAULT_KEY);
  if (!raw) return null;
  try {
    cachedVault = JSON.parse(raw) as KeyVault;
    return cachedVault;
  } catch {
    return null;
  }
}

export function setStoredVault(vault: KeyVault) {
  cachedVault = vault;
  if (typeof window === "undefined") return;
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}

export function clearStoredVault() {
  cachedVault = null;
  if (typeof window === "undefined") return;
  localStorage.removeItem(VAULT_KEY);
  sessionStorage.removeItem(SESSION_RECOVERY_KEY);
}

export function getSessionRecoveryKey(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_RECOVERY_KEY);
}

export function setSessionRecoveryKey(key: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_RECOVERY_KEY, key);
}

// ─── KDF & Vault Cryptography ────────────────────────────────────────────────
export function generateRecoveryKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const parts = [];
  for (let i = 0; i < hex.length; i += 4) {
    parts.push(hex.substring(i, i + 4));
  }
  return parts.join("-");
}

export async function deriveE2EEKeys(pin: string, saltBase64: string): Promise<{ backupKey: CryptoKey; authKeyHash: string }> {
  const salt = base64ToBytes(saltBase64);
  const cleanPin = pin.replace(/\D/g, "");
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    toArrayBuffer(encodeText(cleanPin)),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const pbkdf2Bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hkdfInputKey = await crypto.subtle.importKey(
    "raw",
    pbkdf2Bits,
    "HKDF",
    false,
    ["deriveKey", "deriveBits"]
  );
  const backupKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new ArrayBuffer(0),
      info: toArrayBuffer(encodeText("backup-key")),
    },
    hkdfInputKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  const authKeyBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new ArrayBuffer(0),
      info: toArrayBuffer(encodeText("auth-key")),
    },
    hkdfInputKey,
    256
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", authKeyBits);
  const authKeyHash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return { backupKey, authKeyHash };
}

export async function encryptKeyVault(vault: KeyVault, backupKey: CryptoKey) {
  const plainText = encodeText(JSON.stringify(vault));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    backupKey,
    toArrayBuffer(plainText)
  );
  return {
    ciphertext: bytesToBase64(cipherBuffer),
    nonceOrIv: bytesToBase64(iv),
  };
}

export async function decryptKeyVault(ciphertextBase64: string, backupKey: CryptoKey, nonceOrIvBase64: string): Promise<KeyVault> {
  const cipherText = base64ToBytes(ciphertextBase64);
  const iv = base64ToBytes(nonceOrIvBase64);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    backupKey,
    toArrayBuffer(cipherText)
  );
  return JSON.parse(decodeText(plainBuffer)) as KeyVault;
}

export async function createKeyVault(): Promise<KeyVault> {
  const wrappingKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", wrappingKeyPair.publicKey);
  const privateJwk = await crypto.subtle.exportKey("jwk", wrappingKeyPair.privateKey);

  const masterKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const masterKeyHex = Array.from(masterKeyBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

  return {
    account_master_key: masterKeyHex,
    account_public_wrapping_key: JSON.stringify(publicJwk),
    account_private_wrapping_key: privateJwk,
    conversation_keys: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ─── Public-Key Key Wrapping ───────────────────────────────────────────────
export async function encryptConversationKeyForUser(
  conversationKeyJwk: JsonWebKey,
  recipientPublicWrappingKeyJwkString: string
) {
  const recipientPublicJwk = JSON.parse(recipientPublicWrappingKeyJwkString) as JsonWebKey;
  const recipientKey = await crypto.subtle.importKey(
    "jwk",
    recipientPublicJwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const ephemeralKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  const aesKey = await crypto.subtle.deriveKey(
    { name: "ECDH", public: recipientKey },
    ephemeralKeyPair.privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encodeText(JSON.stringify(conversationKeyJwk));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    aesKey,
    toArrayBuffer(plaintext)
  );

  const ephemeralPublicJwk = await crypto.subtle.exportKey("jwk", ephemeralKeyPair.publicKey);

  const envelope = {
    ephemeral_public_key: ephemeralPublicJwk,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
  };

  return {
    encrypted_conversation_key: bytesToBase64(encodeText(JSON.stringify(envelope))),
    nonce_or_iv: bytesToBase64(iv),
  };
}

export async function decryptConversationKeyShare(
  encryptedShareBase64: string,
  myPrivateWrappingKeyJwk: JsonWebKey
): Promise<JsonWebKey> {
  const envelopeString = decodeText(base64ToBytes(encryptedShareBase64));
  const envelope = JSON.parse(envelopeString);

  const ephemeralKey = await crypto.subtle.importKey(
    "jwk",
    envelope.ephemeral_public_key,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const myPrivateKey = await crypto.subtle.importKey(
    "jwk",
    myPrivateWrappingKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  const aesKey = await crypto.subtle.deriveKey(
    { name: "ECDH", public: ephemeralKey },
    myPrivateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const iv = base64ToBytes(envelope.iv);
  const ciphertext = base64ToBytes(envelope.ciphertext);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    aesKey,
    toArrayBuffer(ciphertext)
  );

  return JSON.parse(decodeText(decrypted)) as JsonWebKey;
}

// ─── E2EE Message Cryptography ──────────────────────────────────────────────
export async function generateConversationKey() {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return { key, jwk };
}

export async function encryptChatMessage({
  conversationId,
  epochNumber,
  body,
}: {
  conversationId: string;
  epochNumber: number;
  body: string;
}) {
  const vault = getStoredVault();
  if (!vault) throw new Error("Key vault not unlocked.");
  const stored = vault.conversation_keys[conversationId]?.[epochNumber];
  if (!stored) throw new Error("No conversation key found for this epoch.");

  const key = await crypto.subtle.importKey(
    "jwk",
    stored.key_jwk,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = encodeText(JSON.stringify({ body, created_at: new Date().toISOString() }));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(plaintext)
  );

  return {
    ciphertext: bytesToBase64(ciphertext),
    nonce_or_iv: bytesToBase64(iv),
    encryption_version: "webcrypto-v2",
    key_epoch_id: stored.epoch_id,
  };
}

export async function decryptChatMessage(message: ChatMessage): Promise<ChatMessage> {
  if (!message.ciphertext || message.deleted_for_everyone_at) return message;
  const vault = getStoredVault();
  if (!vault) return { ...message, decrypt_failed: true };

  const epochId = message.key_epoch_id || message.group_epoch_id;
  let matchingKeyJwk: JsonWebKey | null = null;
  const epochs = vault.conversation_keys[message.conversation_id] || {};
  for (const stored of Object.values(epochs)) {
    if (stored.epoch_id === epochId) {
      matchingKeyJwk = stored.key_jwk;
      break;
    }
  }

  if (!matchingKeyJwk) {
    return { ...message, decrypt_failed: false, missing_envelope: true };
  }

  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      matchingKeyJwk,
      { name: "AES-GCM", length: 256 },
      true,
      ["decrypt"]
    );
    const iv = base64ToBytes(message.nonce_or_iv || "");
    const ciphertext = base64ToBytes(message.ciphertext);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(ciphertext)
    );
    const parsed = JSON.parse(decodeText(plaintext)) as { body: string };
    return {
      ...message,
      decrypted_body: parsed.body,
      decrypt_failed: false,
      missing_envelope: false,
    };
  } catch {
    return { ...message, decrypt_failed: true };
  }
}

export async function decryptGroupMessage(message: ChatMessage): Promise<ChatMessage> {
  return decryptChatMessage(message);
}

// ─── Attachments ──────────────────────────────────────────────────────────
export async function encryptAttachment(file: File) {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, await file.arrayBuffer());
  const exportedKey = await crypto.subtle.exportKey("jwk", key);
  return {
    encryptedBlob: new Blob([encrypted], { type: "application/octet-stream" }),
    encrypted_metadata: JSON.stringify({
      name: file.name,
      type: file.type,
      size: file.size,
      key: exportedKey,
      iv: bytesToBase64(iv),
    }),
  };
}

export async function encryptGroupAttachment(file: File) {
  return encryptAttachment(file);
}

// ─── Backup Setup, Unlock & Reset ──────────────────────────────────────────
export async function setupEncryptedChat(pin: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const saltBase64 = bytesToBase64(saltBytes);

  const { backupKey, authKeyHash } = await deriveE2EEKeys(pin, saltBase64);
  const vault = await createKeyVault();
  vault.backup_salt = saltBase64;

  const encrypted = await encryptKeyVault(vault, backupKey);
  await setupChatCrypto({
    cryptoVersion: 2,
    accountPublicWrappingKey: vault.account_public_wrapping_key,
    kdfAlgorithm: "pbkdf2",
    kdfParams: { iterations: 100000 },
    backupSalt: saltBase64,
    encryptedVault: encrypted.ciphertext,
    nonceOrIv: encrypted.nonceOrIv,
    authKeyHash,
  });

  setStoredVault(vault);
  setSessionRecoveryKey(pin);
  return pin;
}

export async function restoreEncryptedChat(pin: string, userId: string): Promise<boolean> {
  try {
    const profile = await fetchUserCryptoProfile(userId);
    const salt = profile.backup_salt;

    const { backupKey, authKeyHash } = await deriveE2EEKeys(pin, salt);
    const backup = await getChatCryptoBackup(authKeyHash);
    const vault = await decryptKeyVault(backup.encrypted_vault_blob, backupKey, backup.nonce_or_iv);

    vault.backup_salt = salt;

    setStoredVault(vault);
    setSessionRecoveryKey(pin);
    return true;
  } catch (error) {
    console.error("Failed to restore E2EE chat", error);
    throw error;
  }
}

export async function resetEncryptedChat(pin: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const saltBase64 = bytesToBase64(saltBytes);

  const { backupKey, authKeyHash } = await deriveE2EEKeys(pin, saltBase64);
  const vault = await createKeyVault();
  vault.backup_salt = saltBase64;

  const encrypted = await encryptKeyVault(vault, backupKey);
  await resetChatCrypto({
    cryptoVersion: 2,
    accountPublicWrappingKey: vault.account_public_wrapping_key,
    kdfAlgorithm: "pbkdf2",
    kdfParams: { iterations: 100000 },
    backupSalt: saltBase64,
    encryptedVault: encrypted.ciphertext,
    nonceOrIv: encrypted.nonceOrIv,
    authKeyHash,
  });

  setStoredVault(vault);
  setSessionRecoveryKey(pin);
  return pin;
}

function cloneVault(vault: KeyVault): KeyVault {
  return JSON.parse(JSON.stringify(vault)) as KeyVault;
}

function mergeVaults(localVault: KeyVault, remoteVault: KeyVault | null): KeyVault {
  if (!remoteVault) return localVault;
  const merged = cloneVault(localVault);
  for (const [conversationId, remoteEpochs] of Object.entries(remoteVault.conversation_keys || {})) {
    if (!merged.conversation_keys[conversationId]) merged.conversation_keys[conversationId] = {};
    for (const [epochNumberText, remoteStored] of Object.entries(remoteEpochs || {})) {
      const epochNumber = Number(epochNumberText);
      const localStored = merged.conversation_keys[conversationId][epochNumber];
      if (!localStored) {
        merged.conversation_keys[conversationId][epochNumber] = remoteStored;
        continue;
      }
      if (!localStored.key_commitment && remoteStored.key_commitment) {
        localStored.key_commitment = remoteStored.key_commitment;
      }
      if (localStored.key_commitment && remoteStored.key_commitment && localStored.key_commitment === remoteStored.key_commitment) {
        localStored.epoch_id = remoteStored.epoch_id || localStored.epoch_id;
      }
    }
  }
  merged.backup_salt = localVault.backup_salt || remoteVault.backup_salt;
  merged.updated_at = new Date().toISOString();
  return merged;
}

export async function backupVaultIfSessionActive() {
  const vault = getStoredVault();
  const pin = getSessionRecoveryKey();
  if (!vault || !pin) return;

  try {
    let salt = vault.backup_salt;
    if (!salt) {
      const backup = await getChatCryptoBackup();
      salt = backup.salt;
      vault.backup_salt = salt;
      setStoredVault(vault);
    }
    if (!salt) return;

    const { backupKey, authKeyHash } = await deriveE2EEKeys(pin, salt);
    let vaultToUpload = vault;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const backup = await getChatCryptoBackup(authKeyHash);
      let remoteVault: KeyVault | null = null;
      try {
        remoteVault = await decryptKeyVault(backup.encrypted_vault_blob, backupKey, backup.nonce_or_iv);
        remoteVault.backup_salt = salt;
      } catch {
        remoteVault = null;
      }

      vaultToUpload = mergeVaults(vaultToUpload, remoteVault);
      const encrypted = await encryptKeyVault(vaultToUpload, backupKey);
      try {
        await updateChatCryptoBackup({
          encryptedVault: encrypted.ciphertext,
          nonceOrIv: encrypted.nonceOrIv,
          backupVersion: backup.backup_version,
        });
        setStoredVault(vaultToUpload);
        return;
      } catch (error) {
        if (!(error instanceof Error) || !/out of sync/i.test(error.message) || attempt === 1) throw error;
      }
    }
  } catch (err) {
    console.warn("Background backup update failed", err);
  }
}

// ─── Key Sharing & Sync ───────────────────────────────────────────────────
export async function shareConversationKey(conversationId: string, epochNumber: number, participantUserIds: string[]) {
  const vault = getStoredVault();
  if (!vault) throw new Error("Vault is locked.");

  let stored = vault.conversation_keys[conversationId]?.[epochNumber];
  if (!stored) {
    const { jwk } = await generateConversationKey();
    const epochId = crypto.randomUUID();
    if (!vault.conversation_keys[conversationId]) vault.conversation_keys[conversationId] = {};
    vault.conversation_keys[conversationId][epochNumber] = {
      key_jwk: jwk,
      epoch_id: epochId,
      key_commitment: await computeConversationKeyCommitment(jwk),
    };
    stored = vault.conversation_keys[conversationId][epochNumber];
    vault.updated_at = new Date().toISOString();
    setStoredVault(vault);
  }
  const keyCommitment = await ensureStoredKeyCommitment(stored);
  await shareStoredKeyWithParticipants(conversationId, epochNumber, stored, keyCommitment, participantUserIds);

  // Fire-and-forget: vault backup is important but should NEVER block a message send.
  // PBKDF2 with 100k iterations takes 400-800ms — unacceptable in the hot path.
  void backupVaultIfSessionActive();
  return stored;
}

async function shareStoredKeyWithParticipants(
  conversationId: string,
  epochNumber: number,
  stored: KeyVault["conversation_keys"][string][number],
  keyCommitment: string,
  participantUserIds: string[]
) {
  const shareResults = await Promise.all(
    participantUserIds.map(async (userId) => {
      try {
        const profile = await fetchUserCryptoProfileCached(userId);
        const wrapped = await encryptConversationKeyForUser(stored.key_jwk, profile.account_public_wrapping_key);
        return {
          recipient_user_id: userId,
          encrypted_conversation_key: wrapped.encrypted_conversation_key,
          nonce_or_iv: wrapped.nonce_or_iv,
          epoch_number: epochNumber,
          key_commitment: keyCommitment,
          reason: epochNumber === 1 ? "conversation_created" : "member_added",
        };
      } catch {
        // User hasn't set up E2EE yet — skip
        return null;
      }
    })
  );
  const shares = shareResults.filter(Boolean) as NonNullable<(typeof shareResults)[number]>[];

  if (shares.length > 0) {
    const result = await createConversationKeyShares(conversationId, shares);
    // CRITICAL: Backend assigns its own UUID to the epoch. We must update the vault
    // with the backend's epoch_id so that messages use the correct UUID.
    // Without this, the sender uses a frontend-generated UUID that the recipient
    // never sees (they get the backend UUID from key share records) → missing_envelope.
    const backendEpochId = result?.keyShares?.[0]?.epoch_id;
    const freshVault = getStoredVault();
    if (backendEpochId && freshVault?.conversation_keys[conversationId]?.[epochNumber]) {
      freshVault.conversation_keys[conversationId][epochNumber].epoch_id = backendEpochId;
      freshVault.conversation_keys[conversationId][epochNumber].key_commitment = keyCommitment;
      freshVault.updated_at = new Date().toISOString();
      setStoredVault(freshVault);
      stored = freshVault.conversation_keys[conversationId][epochNumber];
    }
  }
}

export async function shareStoredConversationKeys(conversationId: string, participantUserIds: string[]) {
  const vault = getStoredVault();
  if (!vault) throw new Error("Vault is locked.");
  const epochs = vault.conversation_keys[conversationId];
  if (!epochs || Object.keys(epochs).length === 0) {
    throw new Error("This device does not have the existing group keys. Unlock a device that can read this group before adding members.");
  }

  for (const epochNumber of Object.keys(epochs).map(Number).sort((a, b) => a - b)) {
    const stored = epochs[epochNumber];
    if (!stored) continue;
    const keyCommitment = await ensureStoredKeyCommitment(stored);
    await shareStoredKeyWithParticipants(conversationId, epochNumber, stored, keyCommitment, participantUserIds);
  }

  // Fire-and-forget: vault backup is important but should NEVER block a message send.
  // PBKDF2 with 100k iterations takes 400-800ms — unacceptable in the hot path.
  void backupVaultIfSessionActive();
}

export async function syncConversationKeys(
  conversationId: string,
  participantUserIds: string[] = [],
  options: SyncConversationKeyOptions = {}
): Promise<number> {
  const allowCreate = options.allowCreate !== false;
  const allowRepair = options.allowRepair !== false;
  const vault = getStoredVault();
  if (!vault) return 0;

  // Skip server round-trip if we already have a key and synced recently.
  // Always fetch when the vault has no key at all for this conversation.
  const hasLocalKey =
    vault.conversation_keys[conversationId] &&
    Object.keys(vault.conversation_keys[conversationId]).length > 0;
  const lastSync = _keyShareSyncTs.get(conversationId) ?? 0;
  const syncStale = Date.now() - lastSync > KEY_SHARE_SYNC_TTL_MS;
  const shouldFetch = !hasLocalKey || syncStale;

  let shares: RemoteKeyShare[] = [];
  let remoteEpochs: RemoteKeyEpoch[] = [];
  let fetchFailed = false;
  if (shouldFetch) {
    try {
      const data = await fetchConversationKeyShares(conversationId);
      shares = Array.isArray(data.keyShares) ? data.keyShares : [];
      remoteEpochs = Array.isArray(data.epochs) ? data.epochs : [];
      _keyShareSyncTs.set(conversationId, Date.now());
    } catch {
      fetchFailed = true;
    }
  }

  let vaultChanged = false;
  if (!vault.conversation_keys[conversationId]) {
    vault.conversation_keys[conversationId] = {};
  }
  const remoteEpochByNumber = new Map(remoteEpochs.map((epoch) => [epoch.epoch_number, epoch]));

  for (const remoteEpoch of remoteEpochs) {
    const localKeyForEpoch = vault.conversation_keys[conversationId][remoteEpoch.epoch_number];
    if (!localKeyForEpoch) continue;
    const hadCommitment = Boolean(localKeyForEpoch.key_commitment);
    const localCommitment = await ensureStoredKeyCommitment(localKeyForEpoch);
    if (!remoteEpoch.key_commitment || remoteEpoch.key_commitment === localCommitment) {
      if (localKeyForEpoch.epoch_id !== remoteEpoch.id) {
        localKeyForEpoch.epoch_id = remoteEpoch.id;
        vaultChanged = true;
      }
      if (!hadCommitment) vaultChanged = true;
    }
  }

  let undecryptableShareCount = 0;
  for (const share of shares) {
    const epochId = share.epoch_id;
    const epochNumber = share.epoch_number || 1;
    const existing = Object.values(vault.conversation_keys[conversationId]).find((k) => k.epoch_id === epochId);
    if (existing) {
      if (!existing.key_commitment && share.key_commitment) {
        existing.key_commitment = share.key_commitment;
        vaultChanged = true;
      }
    } else {
      const localKeyForEpoch = vault.conversation_keys[conversationId][epochNumber];
      if (localKeyForEpoch) {
        const hadCommitment = Boolean(localKeyForEpoch.key_commitment);
        const localCommitment = await ensureStoredKeyCommitment(localKeyForEpoch);
        if (!share.key_commitment || share.key_commitment === localCommitment) {
          localKeyForEpoch.epoch_id = epochId;
          localKeyForEpoch.key_commitment = localCommitment;
          vaultChanged = true;
          continue;
        }
        if (!hadCommitment) vaultChanged = true;
      }

      try {
        const decryptedKeyJwk = await decryptConversationKeyShare(
          share.encrypted_conversation_key,
          vault.account_private_wrapping_key
        );
        const decryptedCommitment = await computeConversationKeyCommitment(decryptedKeyJwk);
        if (share.key_commitment && share.key_commitment !== decryptedCommitment) {
          undecryptableShareCount += 1;
          continue;
        }
        vault.conversation_keys[conversationId][epochNumber] = {
          key_jwk: decryptedKeyJwk,
          epoch_id: epochId,
          key_commitment: decryptedCommitment,
        };
        vaultChanged = true;
      } catch {
        undecryptableShareCount += 1;
        console.warn("Skipped undecryptable conversation key share. It may have been wrapped for an older account key.");
      }
    }
  }

  const hasEpoch1 = Boolean(vault.conversation_keys[conversationId][1]);
  const remoteHasEpochs = remoteEpochs.length > 0 || shares.length > 0 || undecryptableShareCount > 0;
  if (!hasEpoch1 && participantUserIds.length > 0 && allowCreate) {
    if (fetchFailed || remoteHasEpochs) {
      throw new Error("This device could not recover the existing chat key. Open this chat on a device that can read it so it can re-share the key, or use the explicit encryption reset flow.");
    }
    await shareConversationKey(conversationId, 1, participantUserIds);
    vaultChanged = true;
  } else if (participantUserIds.length > 0 && allowRepair) {
    const epochs = Object.keys(vault.conversation_keys[conversationId]).map(Number);
    const latestEpoch = epochs.length > 0 ? Math.max(...epochs) : 1;
    const repairKey = `${conversationId}:${latestEpoch}`;
    const lastRepair = _keyShareRepairTs.get(repairKey) ?? 0;
    if (latestEpoch && Date.now() - lastRepair > KEY_SHARE_REPAIR_TTL_MS) {
      const localKeyForEpoch = vault.conversation_keys[conversationId][latestEpoch];
      const remoteEpoch = remoteEpochByNumber.get(latestEpoch);
      const localCommitment = localKeyForEpoch ? await ensureStoredKeyCommitment(localKeyForEpoch) : null;
      if (!remoteEpoch?.key_commitment || remoteEpoch.key_commitment === localCommitment) {
        await shareConversationKey(conversationId, latestEpoch, participantUserIds);
        _keyShareRepairTs.set(repairKey, Date.now());
        vaultChanged = true;
      }
    }
  }

  if (vaultChanged) {
    vault.updated_at = new Date().toISOString();
    setStoredVault(vault);
    // Fire-and-forget: don't block the message decrypt path on a slow backup
    void backupVaultIfSessionActive();
  }

  const epochs = Object.keys(vault.conversation_keys[conversationId]).map(Number);
  return epochs.length > 0 ? Math.max(...epochs) : 1;
}

// ─── Legacy Device Stubs to prevent build errors ─────────────────────────────
export async function ensureChatDeviceRegistered() {
  const vault = getStoredVault();
  if (!vault) {
    throw new Error("Vault is locked. Enter your recovery key to unlock.");
  }
  return vault;
}

export function getCurrentChatDeviceId() {
  return "matrix-recovery-device";
}

export async function buildEncryptedMessageEnvelopes({
  conversationUserIds: _conversationUserIds,
  body: _body,
}: {
  conversationUserIds: string[];
  body: string;
}) {
  void _conversationUserIds;
  void _body;
  throw new Error("buildEncryptedMessageEnvelopes is deprecated.");
}

export async function wrapGroupKeyForMembers(
  conversationId: string,
  epochNumber: number,
  memberUserIds: string[]
): Promise<{ envelopes: never[]; epochKeyJwk: JsonWebKey }> {
  const realEpoch = epochNumber === 0 ? 1 : epochNumber;
  const stored = await shareConversationKey(conversationId, realEpoch, memberUserIds);
  return {
    envelopes: [],
    epochKeyJwk: stored.key_jwk,
  };
}

export async function syncGroupKeys(conversationId: string): Promise<number> {
  return syncConversationKeys(conversationId, []);
}

export function getStoredGroupEpochKey(conversationId: string, epochNumber: number) {
  const vault = getStoredVault();
  if (!vault) return null;
  const stored = vault.conversation_keys[conversationId]?.[epochNumber];
  return stored ? { conversation_id: conversationId, epoch_number: epochNumber, epoch_id: stored.epoch_id, key_jwk: stored.key_jwk } : null;
}

export async function loadGroupEpochKey(conversationId: string, epochNumber: number) {
  const vault = getStoredVault();
  if (!vault) return null;
  const stored = vault.conversation_keys[conversationId]?.[epochNumber];
  if (!stored) return null;
  return crypto.subtle.importKey("jwk", stored.key_jwk, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function buildGroupMessagePayload() {
  throw new Error("buildGroupMessagePayload is deprecated.");
}

export function forgetGroupKeys(conversationId: string) {
  const vault = getStoredVault();
  if (!vault) return;
  delete vault.conversation_keys[conversationId];
  setStoredVault(vault);
}
