"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoredVault = getStoredVault;
exports.setStoredVault = setStoredVault;
exports.clearStoredVault = clearStoredVault;
exports.getSessionRecoveryKey = getSessionRecoveryKey;
exports.setSessionRecoveryKey = setSessionRecoveryKey;
exports.generateRecoveryKey = generateRecoveryKey;
exports.deriveE2EEKeys = deriveE2EEKeys;
exports.encryptKeyVault = encryptKeyVault;
exports.decryptKeyVault = decryptKeyVault;
exports.createKeyVault = createKeyVault;
exports.encryptConversationKeyForUser = encryptConversationKeyForUser;
exports.decryptConversationKeyShare = decryptConversationKeyShare;
exports.generateConversationKey = generateConversationKey;
exports.encryptChatMessage = encryptChatMessage;
exports.decryptChatMessage = decryptChatMessage;
exports.decryptGroupMessage = decryptGroupMessage;
exports.encryptAttachment = encryptAttachment;
exports.encryptGroupAttachment = encryptGroupAttachment;
exports.setupEncryptedChat = setupEncryptedChat;
exports.restoreEncryptedChat = restoreEncryptedChat;
exports.resetEncryptedChat = resetEncryptedChat;
exports.backupVaultIfSessionActive = backupVaultIfSessionActive;
exports.shareConversationKey = shareConversationKey;
exports.syncConversationKeys = syncConversationKeys;
exports.ensureChatDeviceRegistered = ensureChatDeviceRegistered;
exports.getCurrentChatDeviceId = getCurrentChatDeviceId;
exports.buildEncryptedMessageEnvelopes = buildEncryptedMessageEnvelopes;
exports.wrapGroupKeyForMembers = wrapGroupKeyForMembers;
exports.syncGroupKeys = syncGroupKeys;
exports.getStoredGroupEpochKey = getStoredGroupEpochKey;
exports.loadGroupEpochKey = loadGroupEpochKey;
exports.buildGroupMessagePayload = buildGroupMessagePayload;
exports.forgetGroupKeys = forgetGroupKeys;
const chatApi_1 = require("./services/chatApi");
const VAULT_KEY = "logoutdev.chat.vault.v2";
const SESSION_RECOVERY_KEY = "logoutdev.chat.recovery-key";
// Memory cache of decrypted vault
let cachedVault = null;
function bytesToBase64(bytes) {
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = "";
    view.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}
function base64ToBytes(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1)
        bytes[index] = binary.charCodeAt(index);
    return bytes;
}
function encodeText(value) {
    return new TextEncoder().encode(value);
}
function decodeText(value) {
    return new TextDecoder().decode(value);
}
function toArrayBuffer(bytes) {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
function getStoredVault() {
    if (cachedVault)
        return cachedVault;
    if (typeof window === "undefined")
        return null;
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw)
        return null;
    try {
        cachedVault = JSON.parse(raw);
        return cachedVault;
    }
    catch {
        return null;
    }
}
function setStoredVault(vault) {
    cachedVault = vault;
    if (typeof window === "undefined")
        return;
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}
function clearStoredVault() {
    cachedVault = null;
    if (typeof window === "undefined")
        return;
    localStorage.removeItem(VAULT_KEY);
    sessionStorage.removeItem(SESSION_RECOVERY_KEY);
}
function getSessionRecoveryKey() {
    if (typeof window === "undefined")
        return null;
    return sessionStorage.getItem(SESSION_RECOVERY_KEY);
}
function setSessionRecoveryKey(key) {
    if (typeof window === "undefined")
        return;
    sessionStorage.setItem(SESSION_RECOVERY_KEY, key);
}
// ─── KDF & Vault Cryptography ────────────────────────────────────────────────
function generateRecoveryKey() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const parts = [];
    for (let i = 0; i < hex.length; i += 4) {
        parts.push(hex.substring(i, i + 4));
    }
    return parts.join("-");
}
async function deriveE2EEKeys(pin, saltBase64) {
    const salt = base64ToBytes(saltBase64);
    const cleanPin = pin.replace(/\D/g, "");
    const keyMaterial = await crypto.subtle.importKey("raw", toArrayBuffer(encodeText(cleanPin)), "PBKDF2", false, ["deriveBits"]);
    const pbkdf2Bits = await crypto.subtle.deriveBits({
        name: "PBKDF2",
        salt: toArrayBuffer(salt),
        iterations: 100000,
        hash: "SHA-256",
    }, keyMaterial, 256);
    const hkdfInputKey = await crypto.subtle.importKey("raw", pbkdf2Bits, "HKDF", false, ["deriveKey", "deriveBits"]);
    const backupKey = await crypto.subtle.deriveKey({
        name: "HKDF",
        hash: "SHA-256",
        salt: new ArrayBuffer(0),
        info: toArrayBuffer(encodeText("backup-key")),
    }, hkdfInputKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const authKeyBits = await crypto.subtle.deriveBits({
        name: "HKDF",
        hash: "SHA-256",
        salt: new ArrayBuffer(0),
        info: toArrayBuffer(encodeText("auth-key")),
    }, hkdfInputKey, 256);
    const hashBuffer = await crypto.subtle.digest("SHA-256", authKeyBits);
    const authKeyHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return { backupKey, authKeyHash };
}
async function encryptKeyVault(vault, backupKey) {
    const plainText = encodeText(JSON.stringify(vault));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, backupKey, toArrayBuffer(plainText));
    return {
        ciphertext: bytesToBase64(cipherBuffer),
        nonceOrIv: bytesToBase64(iv),
    };
}
async function decryptKeyVault(ciphertextBase64, backupKey, nonceOrIvBase64) {
    const cipherText = base64ToBytes(ciphertextBase64);
    const iv = base64ToBytes(nonceOrIvBase64);
    const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, backupKey, toArrayBuffer(cipherText));
    return JSON.parse(decodeText(plainBuffer));
}
async function createKeyVault() {
    const wrappingKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
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
async function encryptConversationKeyForUser(conversationKeyJwk, recipientPublicWrappingKeyJwkString) {
    const recipientPublicJwk = JSON.parse(recipientPublicWrappingKeyJwkString);
    const recipientKey = await crypto.subtle.importKey("jwk", recipientPublicJwk, { name: "ECDH", namedCurve: "P-256" }, true, []);
    const ephemeralKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
    const aesKey = await crypto.subtle.deriveKey({ name: "ECDH", public: recipientKey }, ephemeralKeyPair.privateKey, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = encodeText(JSON.stringify(conversationKeyJwk));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, aesKey, toArrayBuffer(plaintext));
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
async function decryptConversationKeyShare(encryptedShareBase64, myPrivateWrappingKeyJwk) {
    const envelopeString = decodeText(base64ToBytes(encryptedShareBase64));
    const envelope = JSON.parse(envelopeString);
    const ephemeralKey = await crypto.subtle.importKey("jwk", envelope.ephemeral_public_key, { name: "ECDH", namedCurve: "P-256" }, true, []);
    const myPrivateKey = await crypto.subtle.importKey("jwk", myPrivateWrappingKeyJwk, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
    const aesKey = await crypto.subtle.deriveKey({ name: "ECDH", public: ephemeralKey }, myPrivateKey, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const iv = base64ToBytes(envelope.iv);
    const ciphertext = base64ToBytes(envelope.ciphertext);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, aesKey, toArrayBuffer(ciphertext));
    return JSON.parse(decodeText(decrypted));
}
// ─── E2EE Message Cryptography ──────────────────────────────────────────────
async function generateConversationKey() {
    const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const jwk = await crypto.subtle.exportKey("jwk", key);
    return { key, jwk };
}
async function encryptChatMessage({ conversationId, epochNumber, body, }) {
    const vault = getStoredVault();
    if (!vault)
        throw new Error("Key vault not unlocked.");
    const stored = vault.conversation_keys[conversationId]?.[epochNumber];
    if (!stored)
        throw new Error("No conversation key found for this epoch.");
    const key = await crypto.subtle.importKey("jwk", stored.key_jwk, { name: "AES-GCM", length: 256 }, true, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = encodeText(JSON.stringify({ body, created_at: new Date().toISOString() }));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(plaintext));
    return {
        ciphertext: bytesToBase64(ciphertext),
        nonce_or_iv: bytesToBase64(iv),
        encryption_version: "webcrypto-v2",
        key_epoch_id: stored.epoch_id,
    };
}
async function decryptChatMessage(message) {
    if (!message.ciphertext || message.deleted_for_everyone_at)
        return message;
    const vault = getStoredVault();
    if (!vault)
        return { ...message, decrypt_failed: true };
    const epochId = message.key_epoch_id || message.group_epoch_id;
    let matchingKeyJwk = null;
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
        const key = await crypto.subtle.importKey("jwk", matchingKeyJwk, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
        const iv = base64ToBytes(message.nonce_or_iv || "");
        const ciphertext = base64ToBytes(message.ciphertext);
        const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(ciphertext));
        const parsed = JSON.parse(decodeText(plaintext));
        return {
            ...message,
            decrypted_body: parsed.body,
            decrypt_failed: false,
            missing_envelope: false,
        };
    }
    catch {
        return { ...message, decrypt_failed: true };
    }
}
async function decryptGroupMessage(message) {
    return decryptChatMessage(message);
}
// ─── Attachments ──────────────────────────────────────────────────────────
async function encryptAttachment(file) {
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
async function encryptGroupAttachment(file) {
    return encryptAttachment(file);
}
// ─── Backup Setup, Unlock & Reset ──────────────────────────────────────────
async function setupEncryptedChat(pin) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = bytesToBase64(saltBytes);
    const { backupKey, authKeyHash } = await deriveE2EEKeys(pin, saltBase64);
    const vault = await createKeyVault();
    vault.backup_salt = saltBase64;
    const encrypted = await encryptKeyVault(vault, backupKey);
    await (0, chatApi_1.setupChatCrypto)({
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
async function restoreEncryptedChat(pin, userId) {
    try {
        const profile = await (0, chatApi_1.fetchUserCryptoProfile)(userId);
        const salt = profile.backup_salt;
        const { backupKey, authKeyHash } = await deriveE2EEKeys(pin, salt);
        const backup = await (0, chatApi_1.getChatCryptoBackup)(authKeyHash);
        const vault = await decryptKeyVault(backup.encrypted_vault_blob, backupKey, backup.nonce_or_iv);
        vault.backup_salt = salt;
        setStoredVault(vault);
        setSessionRecoveryKey(pin);
        return true;
    }
    catch (error) {
        console.error("Failed to restore E2EE chat", error);
        throw error;
    }
}
async function resetEncryptedChat(pin) {
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = bytesToBase64(saltBytes);
    const { backupKey, authKeyHash } = await deriveE2EEKeys(pin, saltBase64);
    const vault = await createKeyVault();
    vault.backup_salt = saltBase64;
    const encrypted = await encryptKeyVault(vault, backupKey);
    await (0, chatApi_1.resetChatCrypto)({
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
async function backupVaultIfSessionActive() {
    const vault = getStoredVault();
    const pin = getSessionRecoveryKey();
    if (!vault || !pin)
        return;
    try {
        let salt = vault.backup_salt;
        if (!salt) {
            const backup = await (0, chatApi_1.getChatCryptoBackup)();
            salt = backup.salt;
            vault.backup_salt = salt;
            setStoredVault(vault);
        }
        if (!salt)
            return;
        const { backupKey, authKeyHash } = await deriveE2EEKeys(pin, salt);
        const backup = await (0, chatApi_1.getChatCryptoBackup)(authKeyHash);
        const encrypted = await encryptKeyVault(vault, backupKey);
        await (0, chatApi_1.updateChatCryptoBackup)({
            encryptedVault: encrypted.ciphertext,
            nonceOrIv: encrypted.nonceOrIv,
            backupVersion: backup.backup_version,
        });
    }
    catch (err) {
        console.warn("Background backup update failed", err);
    }
}
// ─── Key Sharing & Sync ───────────────────────────────────────────────────
async function shareConversationKey(conversationId, epochNumber, participantUserIds) {
    const vault = getStoredVault();
    if (!vault)
        throw new Error("Vault is locked.");
    let stored = vault.conversation_keys[conversationId]?.[epochNumber];
    if (!stored) {
        const { jwk } = await generateConversationKey();
        const epochId = crypto.randomUUID();
        if (!vault.conversation_keys[conversationId])
            vault.conversation_keys[conversationId] = {};
        vault.conversation_keys[conversationId][epochNumber] = {
            key_jwk: jwk,
            epoch_id: epochId,
        };
        stored = vault.conversation_keys[conversationId][epochNumber];
        vault.updated_at = new Date().toISOString();
        setStoredVault(vault);
    }
    const shares = [];
    for (const userId of participantUserIds) {
        try {
            const profile = await (0, chatApi_1.fetchUserCryptoProfile)(userId);
            const wrapped = await encryptConversationKeyForUser(stored.key_jwk, profile.account_public_wrapping_key);
            shares.push({
                recipient_user_id: userId,
                encrypted_conversation_key: wrapped.encrypted_conversation_key,
                nonce_or_iv: wrapped.nonce_or_iv,
                epoch_number: epochNumber,
                reason: epochNumber === 1 ? "conversation_created" : "member_added",
            });
        }
        catch (err) {
            console.error(`Failed to wrap key for user ${userId}`, err);
        }
    }
    if (shares.length > 0) {
        await (0, chatApi_1.createConversationKeyShares)(conversationId, shares);
    }
    await backupVaultIfSessionActive();
    return stored;
}
async function syncConversationKeys(conversationId, participantUserIds = []) {
    const vault = getStoredVault();
    if (!vault)
        return 0;
    let shares = [];
    try {
        const data = await (0, chatApi_1.fetchConversationKeyShares)(conversationId);
        shares = data.keyShares || [];
    }
    catch {
        // non-fatal
    }
    let vaultChanged = false;
    if (!vault.conversation_keys[conversationId]) {
        vault.conversation_keys[conversationId] = {};
    }
    for (const share of shares) {
        const epochId = share.epoch_id;
        const existing = Object.values(vault.conversation_keys[conversationId]).find((k) => k.epoch_id === epochId);
        if (!existing) {
            try {
                const decryptedKeyJwk = await decryptConversationKeyShare(share.encrypted_conversation_key, vault.account_private_wrapping_key);
                const epochNumber = share.epoch?.epoch_number || share.epoch_number || 1;
                vault.conversation_keys[conversationId][epochNumber] = {
                    key_jwk: decryptedKeyJwk,
                    epoch_id: epochId,
                };
                vaultChanged = true;
            }
            catch (err) {
                console.error("Failed to decrypt share", err);
            }
        }
    }
    const hasEpoch1 = Boolean(vault.conversation_keys[conversationId][1]);
    if (!hasEpoch1 && participantUserIds.length > 0) {
        await shareConversationKey(conversationId, 1, participantUserIds);
        vaultChanged = true;
    }
    if (vaultChanged) {
        vault.updated_at = new Date().toISOString();
        setStoredVault(vault);
        await backupVaultIfSessionActive();
    }
    const epochs = Object.keys(vault.conversation_keys[conversationId]).map(Number);
    return epochs.length > 0 ? Math.max(...epochs) : 1;
}
// ─── Legacy Device Stubs to prevent build errors ─────────────────────────────
async function ensureChatDeviceRegistered() {
    const vault = getStoredVault();
    if (!vault) {
        throw new Error("Vault is locked. Enter your recovery key to unlock.");
    }
    return vault;
}
function getCurrentChatDeviceId() {
    return "matrix-recovery-device";
}
async function buildEncryptedMessageEnvelopes({ conversationUserIds, body, }) {
    throw new Error("buildEncryptedMessageEnvelopes is deprecated.");
}
async function wrapGroupKeyForMembers(conversationId, epochNumber, memberUserIds) {
    const realEpoch = epochNumber === 0 ? 1 : epochNumber;
    const stored = await shareConversationKey(conversationId, realEpoch, memberUserIds);
    return {
        envelopes: [],
        epochKeyJwk: stored.key_jwk,
    };
}
async function syncGroupKeys(conversationId) {
    return syncConversationKeys(conversationId, []);
}
function getStoredGroupEpochKey(conversationId, epochNumber) {
    const vault = getStoredVault();
    if (!vault)
        return null;
    const stored = vault.conversation_keys[conversationId]?.[epochNumber];
    return stored ? { conversation_id: conversationId, epoch_number: epochNumber, epoch_id: stored.epoch_id, key_jwk: stored.key_jwk } : null;
}
async function loadGroupEpochKey(conversationId, epochNumber) {
    const vault = getStoredVault();
    if (!vault)
        return null;
    const stored = vault.conversation_keys[conversationId]?.[epochNumber];
    if (!stored)
        return null;
    return crypto.subtle.importKey("jwk", stored.key_jwk, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}
async function buildGroupMessagePayload() {
    throw new Error("buildGroupMessagePayload is deprecated.");
}
function forgetGroupKeys(conversationId) {
    const vault = getStoredVault();
    if (!vault)
        return;
    delete vault.conversation_keys[conversationId];
    setStoredVault(vault);
}
