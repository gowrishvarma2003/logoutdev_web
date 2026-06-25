"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkChatUsername = checkChatUsername;
exports.updateChatUsername = updateChatUsername;
exports.searchChatUsers = searchChatUsers;
exports.getChatSettings = getChatSettings;
exports.updateChatSettings = updateChatSettings;
exports.registerChatDevice = registerChatDevice;
exports.uploadChatOneTimePrekeys = uploadChatOneTimePrekeys;
exports.fetchChatKeyBundle = fetchChatKeyBundle;
exports.setupChatCrypto = setupChatCrypto;
exports.getChatCryptoBackup = getChatCryptoBackup;
exports.updateChatCryptoBackup = updateChatCryptoBackup;
exports.fetchUserCryptoProfile = fetchUserCryptoProfile;
exports.resetChatCrypto = resetChatCrypto;
exports.createConversationKeyShares = createConversationKeyShares;
exports.fetchConversationKeyShares = fetchConversationKeyShares;
exports.createDirectConversation = createDirectConversation;
exports.listChatConversations = listChatConversations;
exports.getChatConversation = getChatConversation;
exports.listChatMessages = listChatMessages;
exports.sendEncryptedChatMessage = sendEncryptedChatMessage;
exports.markChatRead = markChatRead;
exports.createEncryptedMessageRequest = createEncryptedMessageRequest;
exports.listMessageRequests = listMessageRequests;
exports.respondMessageRequest = respondMessageRequest;
exports.createEncryptedAttachmentUpload = createEncryptedAttachmentUpload;
exports.completeEncryptedAttachment = completeEncryptedAttachment;
const apiBaseUrl_1 = require("@/lib/apiBaseUrl");
function getAuthHeaders() {
    if (typeof window === "undefined")
        return {};
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
}
async function handleResponse(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new Error(data.error || "Request failed");
    return data;
}
function jsonHeaders() {
    return { "Content-Type": "application/json", ...getAuthHeaders() };
}
async function checkChatUsername(username) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/users/username/check?username=${encodeURIComponent(username)}`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(res);
}
async function updateChatUsername(username) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/users/me/username`, {
        method: "PATCH",
        headers: jsonHeaders(),
        body: JSON.stringify({ username }),
    });
    return handleResponse(res);
}
async function searchChatUsers(username) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/users/search?username=${encodeURIComponent(username)}`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(res);
}
async function getChatSettings() {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/settings`, { headers: getAuthHeaders() });
    return handleResponse(res);
}
async function updateChatSettings(settings) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/settings`, {
        method: "PATCH",
        headers: jsonHeaders(),
        body: JSON.stringify(settings),
    });
    return handleResponse(res);
}
async function registerChatDevice(payload) {
    throw new Error("registerChatDevice is deprecated.");
}
async function uploadChatOneTimePrekeys(deviceId, prekeys) {
    throw new Error("uploadChatOneTimePrekeys is deprecated.");
}
async function fetchChatKeyBundle(userId) {
    throw new Error("fetchChatKeyBundle is deprecated.");
}
async function setupChatCrypto(payload) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/crypto/setup`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
}
async function getChatCryptoBackup(authKeyHash) {
    const qs = authKeyHash ? `?auth_key_hash=${encodeURIComponent(authKeyHash)}` : "";
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/crypto/backup${qs}`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(res);
}
async function updateChatCryptoBackup(payload) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/crypto/backup`, {
        method: "PUT",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
}
async function fetchUserCryptoProfile(userId) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/crypto/users/${encodeURIComponent(userId)}/profile`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(res);
}
async function resetChatCrypto(payload) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/crypto/reset`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
}
async function createConversationKeyShares(conversationId, keyShares) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}/key-shares`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ keyShares }),
    });
    return handleResponse(res);
}
async function fetchConversationKeyShares(conversationId) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}/key-shares`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(res);
}
async function createDirectConversation(userId) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/conversations/direct`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ user_id: userId }),
    });
    return handleResponse(res);
}
async function listChatConversations(cursor) {
    const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/conversations${qs}`, { headers: getAuthHeaders() });
    return handleResponse(res);
}
async function getChatConversation(conversationId) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(res);
}
async function listChatMessages(conversationId, options = {}) {
    const params = new URLSearchParams();
    if (options.cursor)
        params.set("cursor", options.cursor);
    if (options.limit)
        params.set("limit", String(options.limit));
    const qs = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}/messages${qs}`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(res);
}
async function sendEncryptedChatMessage(conversationId, payload) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
}
async function markChatRead(conversationId, lastReadMessageId) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}/read`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify({ last_read_message_id: lastReadMessageId || null }),
    });
    return handleResponse(res);
}
async function createEncryptedMessageRequest(payload) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/message-requests`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
}
async function listMessageRequests() {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/message-requests`, { headers: getAuthHeaders() });
    return handleResponse(res);
}
async function respondMessageRequest(requestId, action) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/message-requests/${encodeURIComponent(requestId)}/${action}`, {
        method: "POST",
        headers: jsonHeaders(),
    });
    return handleResponse(res);
}
async function createEncryptedAttachmentUpload(input) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/attachments/upload-url`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(input),
    });
    return handleResponse(res);
}
async function completeEncryptedAttachment(payload) {
    const res = await fetch(`${apiBaseUrl_1.API_BASE_URL}/api/chat/attachments/complete`, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
}
