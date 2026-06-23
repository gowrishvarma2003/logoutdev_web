import type { ChatEnvelope, ChatGroupKeyEnvelope, ChatMessage } from "@/lib/types";
import { fetchChatKeyBundle, registerChatDevice, uploadChatOneTimePrekeys } from "@/lib/services/chatApi";
import {
  listUnconsumedGroupKeyEnvelopes,
  consumeGroupKeyEnvelopes,
  listGroupKeyEpochs,
} from "@/lib/services/groupApi";

const DEVICE_KEY = "logoutdev.chat.device.v1";
const ENCRYPTION_VERSION = "webcrypto-v1";
const PREKEY_BATCH_SIZE = 20;

interface StoredDevice {
  device_id: string;
  identity_private_jwk: JsonWebKey;
  identity_public_jwk: JsonWebKey;
  prekey_private_jwk: JsonWebKey;
  prekey_public_jwk: JsonWebKey;
  signing_private_jwk: JsonWebKey;
  signing_public_jwk: JsonWebKey;
  signed_prekey_signature: string;
}

interface PlainMessage {
  body?: string;
  attachments?: unknown[];
  created_at?: string;
  conversation_id?: string;
  epoch_number?: number;
  group_key?: JsonWebKey;
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

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function decodeText(value: ArrayBuffer): string {
  return new TextDecoder().decode(value);
}

function getStoredDevice(): StoredDevice | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DEVICE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredDevice;
  } catch {
    return null;
  }
}

async function registerStoredDevice(device: StoredDevice) {
  await registerChatDevice({
    device_id: device.device_id,
    device_name: navigator.userAgent.slice(0, 120),
    identity_public_key: JSON.stringify(device.identity_public_jwk),
    signed_prekey_public: JSON.stringify(device.prekey_public_jwk),
    signed_prekey_signature: device.signed_prekey_signature,
    signed_prekey_id: `spk-${device.device_id}`,
  });
}

async function importEcdhPrivate(jwk: JsonWebKey) {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
}

async function importEcdhPublic(jwk: JsonWebKey) {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, true, []);
}

async function importSigningPrivate(jwk: JsonWebKey) {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]);
}

async function signPrekey(signingPrivate: CryptoKey, prekeyPublicJwk: JsonWebKey) {
  const data = encodeText(JSON.stringify(prekeyPublicJwk));
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, signingPrivate, toArrayBuffer(data));
  return bytesToBase64(signature);
}

async function generateEcdhPair() {
  return crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
}

async function generateSigningPair() {
  return crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
}

export async function ensureChatDeviceRegistered() {
  const existing = getStoredDevice();
  if (existing) {
    await registerStoredDevice(existing);
    return existing;
  }

  const identity = await generateEcdhPair();
  const prekey = await generateEcdhPair();
  const signing = await generateSigningPair();
  const signingPrivateJwk = await crypto.subtle.exportKey("jwk", signing.privateKey);
  const signingPublicJwk = await crypto.subtle.exportKey("jwk", signing.publicKey);
  const prekeyPublicJwk = await crypto.subtle.exportKey("jwk", prekey.publicKey);
  const signingPrivate = await importSigningPrivate(signingPrivateJwk);

  const device: StoredDevice = {
    device_id: crypto.randomUUID(),
    identity_private_jwk: await crypto.subtle.exportKey("jwk", identity.privateKey),
    identity_public_jwk: await crypto.subtle.exportKey("jwk", identity.publicKey),
    prekey_private_jwk: await crypto.subtle.exportKey("jwk", prekey.privateKey),
    prekey_public_jwk: prekeyPublicJwk,
    signing_private_jwk: signingPrivateJwk,
    signing_public_jwk: signingPublicJwk,
    signed_prekey_signature: await signPrekey(signingPrivate, prekeyPublicJwk),
  };

  localStorage.setItem(DEVICE_KEY, JSON.stringify(device));
  await registerStoredDevice(device);

  const prekeys = [];
  for (let index = 0; index < PREKEY_BATCH_SIZE; index += 1) {
    const key = await generateEcdhPair();
    prekeys.push({
      key_id: `otk-${Date.now()}-${index}`,
      public_key: JSON.stringify(await crypto.subtle.exportKey("jwk", key.publicKey)),
    });
  }
  await uploadChatOneTimePrekeys(device.device_id, prekeys).catch(() => undefined);
  return device;
}

async function deriveAesKey(privateKey: CryptoKey, publicKey: CryptoKey) {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptForDevice(targetPublicKey: JsonWebKey, payload: PlainMessage): Promise<string> {
  const ephemeral = await generateEcdhPair();
  const publicKey = await importEcdhPublic(targetPublicKey);
  const aesKey = await deriveAesKey(ephemeral.privateKey, publicKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, aesKey, toArrayBuffer(encodeText(JSON.stringify(payload))));
  return JSON.stringify({
    ephemeral_public_key: await crypto.subtle.exportKey("jwk", ephemeral.publicKey),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
  });
}

async function decryptEnvelopePayload(encryptedPayload: string, device: StoredDevice): Promise<PlainMessage> {
  const parsed = JSON.parse(encryptedPayload);
  const privateKey = await importEcdhPrivate(device.prekey_private_jwk);
  const publicKey = await importEcdhPublic(parsed.ephemeral_public_key);
  const aesKey = await deriveAesKey(privateKey, publicKey);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(base64ToBytes(parsed.iv)) },
    aesKey,
    toArrayBuffer(base64ToBytes(parsed.ciphertext))
  );
  return JSON.parse(decodeText(plaintext)) as PlainMessage;
}

export async function buildEncryptedMessageEnvelopes({
  conversationUserIds,
  body,
}: {
  conversationUserIds: string[];
  body: string;
}): Promise<ChatEnvelope[]> {
  await ensureChatDeviceRegistered();
  const payload: PlainMessage = { body, created_at: new Date().toISOString() };
  const envelopes: ChatEnvelope[] = [];

  for (const userId of conversationUserIds) {
    const bundle = await fetchChatKeyBundle(userId);
    if (!bundle.devices.length) {
      throw new Error("This user does not have an active chat device yet.");
    }
    for (const item of bundle.devices) {
      const publicKey = JSON.parse(item.device.signed_prekey_public) as JsonWebKey;
      envelopes.push({
        target_user_id: userId,
        target_device_id: item.device.device_id,
        encrypted_payload: await encryptForDevice(publicKey, payload),
        encryption_version: ENCRYPTION_VERSION,
        key_id: item.device.signed_prekey_id,
        session_id: `${userId}:${item.device.device_id}`,
      });
    }
  }

  return envelopes;
}

export async function decryptChatMessage(message: ChatMessage): Promise<ChatMessage> {
  const device = getStoredDevice();
  if (!device) return { ...message, decrypt_failed: true };
  const envelope = message.envelopes.find((item) => item.target_device_id === device.device_id);
  if (!envelope && message.envelopes.length > 0) return { ...message, missing_envelope: true };
  if (!envelope || message.deleted_for_everyone_at) return message;
  try {
    const payload = await decryptEnvelopePayload(envelope.encrypted_payload, device);
    return { ...message, decrypted_body: payload.body, decrypt_failed: false, missing_envelope: false };
  } catch {
    return { ...message, decrypt_failed: true };
  }
}

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

export function getCurrentChatDeviceId() {
  return getStoredDevice()?.device_id || null;
}

// ─── Group sender-key E2EE ───────────────────────────────────────────────────
// Each group epoch has a symmetric AES-GCM "group session key" generated client-side.
// The key is wrapped (per-device ECDH+AES-GCM) for each active member device and stored
// server-side in chat_group_key_envelopes. Group messages are encrypted ONCE with the
// current epoch key (store-once sender-key design). On membership change the epoch
// rotates and the old key never reaches removed/left devices, so they cannot decrypt
// future messages. New members only get the new epoch key, so they cannot decrypt old
// history unless keys are explicitly re-wrapped for them.

const GROUP_KEY_STORAGE = "logoutdev.chat.group-keys.v1";
const GROUP_ENCRYPTION_VERSION = "group-senderkey-v1";

interface StoredGroupEpochKey {
  conversation_id: string;
  epoch_number: number;
  epoch_id: string;
  key_jwk: JsonWebKey;
  created_at: string;
}

interface GroupKeyStore {
  [conversationId: string]: {
    [epochNumber: number]: StoredGroupEpochKey;
  };
}

function readGroupKeyStore(): GroupKeyStore {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(GROUP_KEY_STORAGE);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as GroupKeyStore;
  } catch {
    return {};
  }
}

function writeGroupKeyStore(store: GroupKeyStore) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GROUP_KEY_STORAGE, JSON.stringify(store));
  } catch {
    // storage may be full; fall back to in-memory only
  }
}

function getGroupEpochKey(conversationId: string, epochNumber: number): StoredGroupEpochKey | null {
  const store = readGroupKeyStore();
  return store[conversationId]?.[epochNumber] || null;
}

function setGroupEpochKey(conversationId: string, epochNumber: number, epochId: string, key: CryptoKey, jwk: JsonWebKey) {
  const store = readGroupKeyStore();
  if (!store[conversationId]) store[conversationId] = {};
  store[conversationId][epochNumber] = {
    conversation_id: conversationId,
    epoch_number: epochNumber,
    epoch_id: epochId,
    key_jwk: jwk,
    created_at: new Date().toISOString(),
  };
  writeGroupKeyStore(store);
}

async function importGroupKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function generateGroupSessionKey(): Promise<{ key: CryptoKey; jwk: JsonWebKey }> {
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const jwk = await crypto.subtle.exportKey("jwk", key);
  return { key, jwk };
}

export async function storeGroupEpochKeyFromJwk(
  conversationId: string,
  epochNumber: number,
  epochId: string,
  jwk: JsonWebKey
) {
  const key = await importGroupKey(jwk);
  setGroupEpochKey(conversationId, epochNumber, epochId, key, jwk);
  return key;
}

export interface WrappedGroupKey {
  target_user_id: string;
  target_device_id: string;
  encrypted_key_payload: string;
  encryption_version: string;
}

/**
 * Wraps a group session key for a list of member devices using the existing
 * per-device ECDH (signed prekey) envelope flow. The server stores only the
 * opaque wrapped payloads and never sees the group key.
 */
export async function wrapGroupKeyForMembers(
  conversationId: string,
  epochNumber: number,
  memberUserIds: string[]
): Promise<{ envelopes: WrappedGroupKey[]; epochKeyJwk: JsonWebKey }> {
  const device = getStoredDevice();
  if (!device) throw new Error("Chat device not initialized.");
  const { jwk } = await generateGroupSessionKey();
  const envelopes: WrappedGroupKey[] = [];

  for (const userId of memberUserIds) {
    const bundle = await fetchChatKeyBundle(userId);
    if (!bundle.devices.length) {
      throw new Error(`User ${userId} has no active chat device yet.`);
    }
    for (const item of bundle.devices) {
      const publicKey = JSON.parse(item.device.signed_prekey_public) as JsonWebKey;
      const wrapped = await encryptForDevice(publicKey, {
        conversation_id: conversationId,
        epoch_number: epochNumber,
        group_key: jwk,
        created_at: new Date().toISOString(),
      });
      envelopes.push({
        target_user_id: userId,
        target_device_id: item.device.device_id,
        encrypted_key_payload: wrapped,
        encryption_version: "webcrypto-v1",
      });
    }
  }

  return { envelopes, epochKeyJwk: jwk };
}

async function decryptGroupKeyEnvelope(envelope: ChatGroupKeyEnvelope): Promise<{ conversation_id: string; epoch_number: number; group_key: JsonWebKey; epoch_id: string }> {
  const device = getStoredDevice();
  if (!device) throw new Error("Chat device not initialized.");
  const payload = await decryptEnvelopePayload(envelope.encrypted_key_payload, device);
  return {
    conversation_id: payload.conversation_id as string,
    epoch_number: payload.epoch_number as number,
    group_key: payload.group_key as JsonWebKey,
    epoch_id: envelope.epoch_id,
  };
}

/**
 * Fetches and consumes unconsumed group key envelopes for this device, importing
 * each decrypted group session key into local storage. Returns the latest epoch
 * number known locally for this conversation.
 */
export async function syncGroupKeys(conversationId: string): Promise<number> {
  const device = getStoredDevice();
  if (!device) return 0;

  const { envelopes } = await listUnconsumedGroupKeyEnvelopes(conversationId, [device.device_id]);
  let latestEpoch = 0;
  const consumedIds: string[] = [];

  for (const envelope of envelopes) {
    try {
      const decrypted = await decryptGroupKeyEnvelope(envelope);
      const key = await importGroupKey(decrypted.group_key);
      setGroupEpochKey(conversationId, decrypted.epoch_number, decrypted.epoch_id, key, decrypted.group_key);
      if (decrypted.epoch_number > latestEpoch) latestEpoch = decrypted.epoch_number;
      consumedIds.push(envelope.id);
    } catch {
      // skip undecryptable envelope rather than blocking sync
    }
  }

  if (consumedIds.length) {
    await consumeGroupKeyEnvelopes(consumedIds).catch(() => undefined);
  }

  // Refresh canonical epoch list so client knows the server's current epoch even
  // when the latest envelope hasn't arrived for this device.
  try {
    const { epochs } = await listGroupKeyEpochs(conversationId);
    if (epochs.length) {
      const maxServerEpoch = Math.max(...epochs.map((epoch) => epoch.epoch_number));
      if (maxServerEpoch > latestEpoch) latestEpoch = maxServerEpoch;
    }
  } catch {
    // non-fatal
  }

  return latestEpoch;
}

export function getStoredGroupEpochKey(conversationId: string, epochNumber: number): StoredGroupEpochKey | null {
  return getGroupEpochKey(conversationId, epochNumber);
}

export async function loadGroupEpochKey(conversationId: string, epochNumber: number): Promise<CryptoKey | null> {
  const stored = getGroupEpochKey(conversationId, epochNumber);
  if (!stored) return null;
  try {
    return await importGroupKey(stored.key_jwk);
  } catch {
    return null;
  }
}

export async function encryptGroupMessage(
  conversationId: string,
  epochId: string,
  epochNumber: number,
  body: string
): Promise<{ ciphertext: string; iv: string; encryption_version: string } | null> {
  const key = await loadGroupEpochKey(conversationId, epochNumber);
  if (!key) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = encodeText(JSON.stringify({ body, created_at: new Date().toISOString() }));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(encoded));
  return {
    ciphertext: bytesToBase64(ciphertext),
    iv: bytesToBase64(iv),
    encryption_version: GROUP_ENCRYPTION_VERSION,
  };
}

async function decryptGroupPayload(payload: { encrypted_payload: string; nonce_or_iv: string | null }, conversationId: string, epochNumber: number): Promise<string | null> {
  const key = await loadGroupEpochKey(conversationId, epochNumber);
  if (!key) return null;
  try {
    const iv = base64ToBytes(payload.nonce_or_iv || "");
    const ciphertext = base64ToBytes(payload.encrypted_payload);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(ciphertext));
    const parsed = JSON.parse(decodeText(plaintext)) as { body: string };
    return parsed.body;
  } catch {
    return null;
  }
}

/**
 * Decrypts a group message. Returns the message with decrypted_body set, or with
 * decrypt_failed / key_missing flags when the local epoch key is unavailable
 * (e.g. message belongs to an epoch before the user joined).
 */
export async function decryptGroupMessage(message: ChatMessage): Promise<ChatMessage> {
  if (!message.group_payload || message.deleted_for_everyone_at) return message;
  const stored = readGroupKeyStore();
  const conversationEpochs = stored[message.conversation_id] || {};
  let matchingEpoch: StoredGroupEpochKey | null = null;
  for (const candidate of Object.values(conversationEpochs)) {
    if (candidate.epoch_id === message.group_payload?.group_epoch_id) {
      matchingEpoch = candidate;
      break;
    }
  }
  if (!matchingEpoch) {
    return { ...message, decrypt_failed: false, missing_envelope: true };
  }
  const body = await decryptGroupPayload(message.group_payload, message.conversation_id, matchingEpoch.epoch_number);
  if (body === null) {
    return { ...message, decrypt_failed: true };
  }
  return { ...message, decrypted_body: body, decrypt_failed: false, missing_envelope: false };
}

export async function buildGroupMessagePayload(input: {
  conversationId: string;
  epochId: string;
  epochNumber: number;
  body: string;
}): Promise<{
  group_encrypted_payload: string;
  group_nonce_or_iv: string;
  encryption_version: string;
  group_epoch_id: string;
  group_epoch_number: number;
} | null> {
  const encrypted = await encryptGroupMessage(input.conversationId, input.epochId, input.epochNumber, input.body);
  if (!encrypted) return null;
  return {
    group_encrypted_payload: encrypted.ciphertext,
    group_nonce_or_iv: encrypted.iv,
    encryption_version: encrypted.encryption_version,
    group_epoch_id: input.epochId,
    group_epoch_number: input.epochNumber,
  };
}

export async function encryptGroupAttachment(file: File) {
  // Group attachments reuse the per-file AES-GCM encryption used by direct chat.
  // The file key travels inside the group-encrypted message body, so only members
  // with the current epoch key can decrypt attachment metadata. New members cannot
  // decrypt old attachments unless old epoch keys are explicitly re-wrapped for them.
  return encryptAttachment(file);
}

export function forgetGroupKeys(conversationId: string) {
  const store = readGroupKeyStore();
  delete store[conversationId];
  writeGroupKeyStore(store);
}
