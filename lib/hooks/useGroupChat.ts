"use client";

import { useCallback, useEffect, useState } from "react";
import {
  syncGroupKeys,
  wrapGroupKeyForMembers,
  storeGroupEpochKeyFromJwk,
  buildGroupMessagePayload,
  decryptGroupMessage,
  getStoredGroupEpochKey,
} from "@/lib/chatCrypto";
import {
  addGroupMembers,
  listGroupMembers,
  removeGroupMember,
  leaveGroup,
  sendGroupMessage as sendGroupMessageApi,
} from "@/lib/services/groupApi";
import { getGroup } from "@/lib/services/groupApi";
import type { ChatGroupMember, ChatGroupKeyEpoch } from "@/lib/types";
import { listGroupKeyEpochs } from "@/lib/services/groupApi";

interface CurrentEpoch {
  epoch_id: string;
  epoch_number: number;
}

export function useGroupChat(conversationId: string | null) {
  const [currentEpoch, setCurrentEpoch] = useState<CurrentEpoch | null>(null);
  const [members, setMembers] = useState<ChatGroupMember[]>([]);
  const [epochs, setEpochs] = useState<ChatGroupKeyEpoch[]>([]);
  const [syncing, setSyncing] = useState(false);

  const refreshEpochs = useCallback(async (id: string) => {
    try {
      const data = await listGroupKeyEpochs(id);
      setEpochs(data.epochs);
    } catch {
      // non-fatal
    }
  }, []);

  const sync = useCallback(async (id: string) => {
    setSyncing(true);
    try {
      const latestLocal = await syncGroupKeys(id);
      let current: CurrentEpoch | null = null;
      if (id && latestLocal) {
        const stored = getStoredGroupEpochKey(id, latestLocal);
        if (stored) current = { epoch_id: stored.epoch_id, epoch_number: stored.epoch_number };
      }
      if (!current && id) {
        // Fall back to the server-provided current epoch number from group details.
        try {
          const { conversation } = await getGroup(id);
          const serverEpochNumber = conversation.group?.current_epoch_number;
          if (serverEpochNumber) {
            const storedEpoch = getStoredGroupEpochKey(id, serverEpochNumber);
            if (storedEpoch) {
              current = { epoch_id: storedEpoch.epoch_id, epoch_number: storedEpoch.epoch_number };
            }
          }
        } catch {
          // ignore
        }
      }
      if (current) setCurrentEpoch(current);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    async function boot(id: string) {
      await refreshEpochs(id);
      await sync(id);
      try {
        const data = await listGroupMembers(id);
        if (!cancelled) setMembers(data.members);
      } catch {
        // ignore
      }
    }
    boot(conversationId);
    return () => {
      cancelled = true;
    };
  }, [conversationId, refreshEpochs, sync]);

  const reloadMembers = useCallback(async () => {
    if (!conversationId) return;
    try {
      const data = await listGroupMembers(conversationId);
      setMembers(data.members);
    } catch {
      // ignore
    }
  }, [conversationId]);

  const rotateAndAdd = useCallback(
    async (newUserIds: string[]) => {
      if (!conversationId) throw new Error("No group selected.");
      // Existing active members plus new members = full target set.
      const existingIds = members.map((member) => member.user_id);
      const allTargets = Array.from(new Set([...existingIds, ...newUserIds]));
      // We don't know the server-assigned epoch_number yet; wrapping the payload
      // uses 0 as placeholder. The client later syncs the real envelope with the
      // DB-assigned epoch_id/epoch_number and matches by epoch_id during decrypt.
      const { envelopes, epochKeyJwk } = await wrapGroupKeyForMembers(conversationId, 0, allTargets);
      void epochKeyJwk; // fetched back via sync, no local storage needed pre-epoch-id
      const result = await addGroupMembers(conversationId, { member_user_ids: newUserIds, epoch_envelopes: envelopes });
      await sync(conversationId);
      await reloadMembers();
      return result;
    },
    [conversationId, members, sync, reloadMembers]
  );

  const rotateAndRemove = useCallback(
    async (userId: string) => {
      if (!conversationId) throw new Error("No group selected.");
      const remaining = members.filter((member) => member.user_id !== userId).map((member) => member.user_id);
      const { envelopes } = await wrapGroupKeyForMembers(conversationId, 0, remaining);
      const result = await removeGroupMember(conversationId, userId, envelopes);
      await sync(conversationId);
      await reloadMembers();
      return result;
    },
    [conversationId, members, sync, reloadMembers]
  );

  const rotateAndLeave = useCallback(
    async (currentUserId: string) => {
      if (!conversationId) throw new Error("No group selected.");
      const remaining = members
        .filter((member) => member.user_id !== currentUserId)
        .map((member) => member.user_id);
      const { envelopes } = await wrapGroupKeyForMembers(conversationId, 0, remaining);
      const result = await leaveGroup(conversationId, envelopes);
      return result;
    },
    [conversationId, members]
  );

  const sendGroupMessage = useCallback(
    async (body: string, clientMessageId: string) => {
      if (!conversationId || !currentEpoch) throw new Error("Group key not synced. Try again.");
      try {
        const payload = await buildGroupMessagePayload({
          conversationId,
          epochId: currentEpoch.epoch_id,
          epochNumber: currentEpoch.epoch_number,
          body,
        });
        if (!payload) throw new Error("Could not encrypt group message. Sync the latest group key.");
        const res = await sendGroupMessageApi(conversationId, {
          client_message_id: clientMessageId,
          message_type: "text",
          encryption_version: payload.encryption_version,
          group_epoch_id: payload.group_epoch_id,
          group_epoch_number: payload.group_epoch_number,
          group_encrypted_payload: payload.group_encrypted_payload,
          group_nonce_or_iv: payload.group_nonce_or_iv,
        });
        return res.message;
      } catch (error) {
        // Stale epoch likely; re-sync so the next attempt uses the latest key.
        await sync(conversationId);
        throw error;
      }
    },
    [conversationId, currentEpoch, sync]
  );

  return {
    currentEpoch,
    epochs,
    members,
    syncing,
    sync,
    reloadMembers,
    rotateAndAdd,
    rotateAndRemove,
    rotateAndLeave,
    sendGroupMessage,
    decryptGroupMessage,
    storeLocalEpochKey: storeGroupEpochKeyFromJwk,
  };
}