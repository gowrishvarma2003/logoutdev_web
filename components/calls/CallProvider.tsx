"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowsPointingOutIcon,
  ComputerDesktopIcon,
  MicrophoneIcon,
  NoSymbolIcon,
  PhoneArrowDownLeftIcon,
  PhoneArrowUpRightIcon,
  PhoneIcon,
  SignalIcon,
  SpeakerWaveIcon,
  Squares2X2Icon,
  UserGroupIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Track, type LocalTrack, type Room } from "livekit-client";
import type { CallConfig, CallParticipant, CallRecord, ChatConversation, User } from "@/lib/types";
import type { ChatSocketApi } from "@/lib/hooks/useChatSocket";
import { getCurrentChatDeviceId } from "@/lib/chatCrypto";
import * as callApi from "@/lib/services/callApi";
import * as webrtc from "@/lib/calls/webrtcService";
import * as sfuService from "@/lib/calls/sfuService";

type CallUiState = "idle" | "starting" | "requesting_permissions" | "dialing" | "outgoing_ringing" | "incoming_ringing" | "connecting" | "connected" | "reconnecting" | "ending" | "ended" | "failed" | "rejected" | "missed" | "busy";

interface PendingCallIntent {
  conversation: ChatConversation;
  kind: "audio" | "video";
  mode: CallRecord["call_mode"];
  direction: "outgoing" | "incoming";
  startedAt: number;
}

export type CallTileKind = "camera" | "screen";

export interface CallTile {
  id: string;
  participantId: string;
  userId: string;
  label: string;
  kind: CallTileKind;
  stream: MediaStream | null;
  isLocal: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  status?: CallParticipant["status"];
}

interface CallContextValue {
  activeCall: CallRecord | null;
  incomingCall: CallRecord | null;
  pendingCallIntent: PendingCallIntent | null;
  state: CallUiState;
  error: string;
  isEnding: boolean;
  durationSeconds: number;
  localStream: MediaStream | null;
  localScreenStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  remoteTrackTiles: Record<string, CallTile>;
  isScreenSharing: boolean;
  audioPlaybackBlocked: boolean;
  audioPlaybackRetryToken: number;
  startDirectCall: (conversation: ChatConversation, kind: "audio" | "video") => Promise<void>;
  startGroupCall: (conversation: ChatConversation, kind: "audio" | "video") => Promise<void>;
  acceptIncoming: () => Promise<void>;
  rejectIncoming: () => Promise<void>;
  joinGroupCall: (call?: CallRecord) => Promise<void>;
  endActiveCall: () => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
  enableRemoteAudio: () => Promise<void>;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCalls() {
  const value = useContext(CallContext);
  if (!value) throw new Error("useCalls must be used inside CallProvider");
  return value;
}

function otherParticipant(call: CallRecord | null, userId: string) {
  return call?.participants.find((participant) => participant.user_id !== userId) || null;
}

function wantsVideo(call: CallRecord | null) {
  return Boolean(call?.call_type.includes("video"));
}

function streamFromLocalTracks(tracks: LocalTrack[], source?: Track.Source) {
  return new MediaStream(
    tracks
      .filter((track) => !source || track.source === source)
      .map((track) => track.mediaStreamTrack)
      .filter(Boolean)
  );
}

function nameForParticipant(participant?: CallParticipant | null, fallback = "Participant") {
  if (!participant?.user) return fallback;
  return participant.user.username ? `@${participant.user.username}` : participant.user.name || fallback;
}

function participantForUser(call: CallRecord | null, userId: string) {
  return call?.participants.find((participant) => participant.user_id === userId) || null;
}

export function buildCallTiles(input: {
  call: CallRecord | null;
  currentUserId: string;
  localStream: MediaStream | null;
  localScreenStream: MediaStream | null;
  remoteTrackTiles: Record<string, CallTile>;
  remoteStreams: Record<string, MediaStream>;
}) {
  const tiles: CallTile[] = [];
  const localParticipant = participantForUser(input.call, input.currentUserId);
  tiles.push({
    id: "local-camera",
    participantId: localParticipant?.id || input.currentUserId,
    userId: input.currentUserId,
    label: "You",
    kind: "camera",
    stream: input.localStream,
    isLocal: true,
    isMuted: Boolean(localParticipant?.is_muted) || !input.localStream?.getAudioTracks().some((track) => track.enabled && track.readyState === "live"),
    isCameraOff: !input.localStream?.getVideoTracks().some((track) => track.enabled),
    isScreenSharing: Boolean(input.localScreenStream),
    status: localParticipant?.status,
  });

  if (input.localScreenStream) {
    tiles.push({
      id: "local-screen",
      participantId: localParticipant?.id || input.currentUserId,
      userId: input.currentUserId,
      label: "Your screen",
      kind: "screen",
      stream: input.localScreenStream,
      isLocal: true,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: true,
      status: localParticipant?.status,
    });
  }

  const explicitRemoteTiles = Object.values(input.remoteTrackTiles);
  if (explicitRemoteTiles.length) {
    tiles.push(...explicitRemoteTiles);
  } else {
    Object.entries(input.remoteStreams).forEach(([userId, stream]) => {
      const participant = participantForUser(input.call, userId);
      tiles.push({
        id: `remote-${userId}`,
        participantId: participant?.id || userId,
        userId,
        label: nameForParticipant(participant),
        kind: "camera",
        stream,
        isLocal: false,
        isMuted: Boolean(participant?.is_muted),
        isCameraOff: Boolean(participant?.is_camera_off),
        isScreenSharing: Boolean(participant?.is_screen_sharing),
        status: participant?.status,
      });
    });
  }

  return tiles;
}

export function selectPinnedTileId(tiles: CallTile[], manualPinnedTileId: string | null, forceGrid = false) {
  if (forceGrid) return null;
  if (manualPinnedTileId && tiles.some((tile) => tile.id === manualPinnedTileId)) return manualPinnedTileId;
  if (manualPinnedTileId) return null;
  return tiles.find((tile) => tile.kind === "screen")?.id || null;
}

export function CallProvider({
  children,
  user,
  socket,
}: {
  children: React.ReactNode;
  user: User;
  socket: ChatSocketApi;
}) {
  const [, setConfig] = useState<CallConfig | null>(null);
  const [activeCall, setActiveCall] = useState<CallRecord | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallRecord | null>(null);
  const [pendingCallIntent, setPendingCallIntent] = useState<PendingCallIntent | null>(null);
  const [state, setState] = useState<CallUiState>("idle");
  const [error, setError] = useState("");
  const [isEnding, setIsEnding] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [remoteTrackTiles, setRemoteTrackTiles] = useState<Record<string, CallTile>>({});
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false);
  const [audioPlaybackRetryToken, setAudioPlaybackRetryToken] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const roomRef = useRef<Room | null>(null);
  const liveKitTracksRef = useRef<LocalTrack[]>([]);
  const liveKitScreenTracksRef = useRef<LocalTrack[]>([]);
  const screenTracksRef = useRef<MediaStreamTrack[]>([]);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const activeCallRef = useRef<CallRecord | null>(null);
  const configRef = useRef<CallConfig | null>(null);
  const offeredCallIdsRef = useRef<Set<string>>(new Set());
  const startTokenRef = useRef(0);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const setCurrentCall = useCallback((call: CallRecord | null) => {
    activeCallRef.current = call;
    setActiveCall(call);
  }, []);

  const setCurrentConfig = useCallback((nextConfig: CallConfig) => {
    configRef.current = nextConfig;
    setConfig(nextConfig);
  }, []);

  const ensureCallConfig = useCallback(async () => {
    if (configRef.current) return configRef.current;
    const { config: nextConfig } = await callApi.getCallConfig();
    setCurrentConfig(nextConfig);
    return nextConfig;
  }, [setCurrentConfig]);

  const cleanup = useCallback(async (nextState: CallUiState = "idle") => {
    pcRef.current?.close();
    pcRef.current = null;
    pendingIceCandidatesRef.current = [];
    offeredCallIdsRef.current.clear();
    screenTracksRef.current.forEach((track) => track.stop());
    screenTracksRef.current = [];
    liveKitScreenTracksRef.current.forEach((track) => {
      roomRef.current?.localParticipant.unpublishTrack(track).catch(() => undefined);
      track.stop();
    });
    liveKitScreenTracksRef.current = [];
    setLocalScreenStream(null);
    setIsScreenSharing(false);
    setAudioPlaybackBlocked(false);
    await Promise.resolve(sfuService.leaveRoom(roomRef.current, liveKitTracksRef.current)).catch(() => undefined);
    roomRef.current = null;
    liveKitTracksRef.current = [];
    webrtc.stopLocalMedia(localStream);
    setLocalStream(null);
    setRemoteStreams({});
    setRemoteTrackTiles({});
    if (activeCallRef.current) socket.leaveCallRoom(activeCallRef.current.id);
    setCurrentCall(null);
    setIncomingCall(null);
    setPendingCallIntent(null);
    setDurationSeconds(0);
    setState(nextState);
  }, [localStream, setCurrentCall, socket]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const [{ config: nextConfig }, { call }] = await Promise.all([
          callApi.getCallConfig(),
          callApi.getActiveCall(),
        ]);
        if (cancelled) return;
        setCurrentConfig(nextConfig);
        if (call) {
          setCurrentCall(call);
          socket.joinCallRoom(call.id);
          setState(call.status === "ringing" && call.created_by !== user.id ? "incoming_ringing" : "reconnecting");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not initialize calls");
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, [setCurrentCall, setCurrentConfig, socket, user.id]);

  useEffect(() => {
    if (!activeCall?.started_at && state !== "connected") return;
    const startedAt = activeCall?.started_at ? new Date(activeCall.started_at).getTime() : Date.now();
    const timer = window.setInterval(() => {
      setDurationSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeCall?.started_at, state]);

  const ensureLocalStream = useCallback(async (video: boolean) => {
    if (localStream && (!video || localStream.getVideoTracks().length)) return localStream;
    if (localStream) webrtc.stopLocalMedia(localStream);
    setState("requesting_permissions");
    const stream = await webrtc.getLocalMedia({ audio: true, video });
    setLocalStream(stream);
    return stream;
  }, [localStream]);

  const ensurePeer = useCallback((call: CallRecord, stream: MediaStream | null) => {
    if (pcRef.current) {
      if (stream) webrtc.addLocalTracks(pcRef.current, stream);
      return pcRef.current;
    }
    const pc = webrtc.createPeerConnection(configRef.current?.rtc.iceServers || [], {
      onRemoteStream: (stream) => setRemoteStreams((prev) => ({ ...prev, remote: stream })),
      onIceCandidate: (candidate) => {
        const target = otherParticipant(call, user.id);
        socket.emit("call:ice-candidate", {
          call_id: call.id,
          to_user_id: target?.user_id,
          candidate: candidate.toJSON(),
        });
      },
      onConnectionState: (connectionState) => {
        if (connectionState === "connected") setState("connected");
        if (connectionState === "disconnected") setState("reconnecting");
        if (connectionState === "failed") setState("failed");
      },
    });
    if (stream) webrtc.addLocalTracks(pc, stream);
    pcRef.current = pc;
    return pc;
  }, [socket, user.id]);

  const flushPendingIceCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc?.remoteDescription || !pendingIceCandidatesRef.current.length) return;
    const candidates = pendingIceCandidatesRef.current.splice(0);
    for (const candidate of candidates) {
      await webrtc.addIceCandidate(pc, candidate).catch(() => undefined);
    }
  }, []);

  const syncLiveKitLocalTracks = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const tracks = Array.from(room.localParticipant.trackPublications.values())
      .map((publication) => publication.track)
      .filter((track): track is LocalTrack => track !== undefined && track.source !== Track.Source.ScreenShare);
    liveKitTracksRef.current = tracks;
    setLocalStream(streamFromLocalTracks(tracks));
  }, []);

  const enableRemoteAudio = useCallback(async () => {
    try {
      await roomRef.current?.startAudio();
      setAudioPlaybackBlocked(false);
    } catch {
      setAudioPlaybackBlocked(true);
    } finally {
      setAudioPlaybackRetryToken((token) => token + 1);
    }
  }, []);

  useEffect(() => {
    if (!audioPlaybackBlocked) return;
    const retry = () => {
      void enableRemoteAudio();
    };
    window.addEventListener("pointerdown", retry, { once: true, capture: true });
    window.addEventListener("keydown", retry, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", retry, { capture: true });
      window.removeEventListener("keydown", retry, { capture: true });
    };
  }, [audioPlaybackBlocked, enableRemoteAudio]);

  const joinSfu = useCallback(async (call: CallRecord, details = null as Awaited<ReturnType<typeof callApi.joinCall>>["sfu"] | null) => {
    const config = await ensureCallConfig();
    let joinedCall = call;
    if (!details) {
      const joined = await callApi.joinCall(call.id, getCurrentChatDeviceId());
      details = joined.sfu;
      joinedCall = joined.call;
    }
    if (!details) throw new Error("Group media credentials were not returned.");
    const roomAck = await socket.joinCallRoomWithAck(joinedCall.id).catch((err) => ({ ok: false, error: err instanceof Error ? err.message : "Could not join realtime call room." }));
    if (roomAck?.ok === false) {
      console.warn("[Calls] Realtime call room join failed:", roomAck.error);
    }
    setCurrentCall(joinedCall);
    setPendingCallIntent(null);
    setIncomingCall(null);
    setState("connecting");
    try {
      const joinedRoom = await sfuService.joinRoom(details, { audio: true, video: wantsVideo(joinedCall), iceServers: config.rtc.iceServers }, {
        onConnectionState: (connectionState) => {
          if (connectionState === "connected") setState("connected");
          if (connectionState === "reconnecting") setState("reconnecting");
          if (connectionState === "failed" || connectionState === "disconnected") setState((current) => (current === "ending" ? current : "failed"));
        },
        onError: (mediaError) => setError(mediaError.message || "Media device error."),
        onAudioPlaybackStatus: (playing) => setAudioPlaybackBlocked(!playing),
        onRemoteStream: (participantId, stream) => setRemoteStreams((prev) => ({ ...prev, [participantId]: stream })),
        onRemoteTrack: (update) => {
          if (update.kind === "audio") return;
          const tileKind: CallTileKind = update.kind;
          setRemoteTrackTiles((prev) => {
            const participant = participantForUser(activeCallRef.current || joinedCall, update.participantId);
            return {
              ...prev,
              [`${update.participantId}:${update.trackId}`]: {
                id: `${update.participantId}:${update.trackId}`,
                participantId: participant?.id || update.participantId,
                userId: update.participantId,
                label: update.kind === "screen" ? `${nameForParticipant(participant)}'s screen` : nameForParticipant(participant),
                kind: tileKind,
                stream: update.stream,
                isLocal: false,
                isMuted: Boolean(participant?.is_muted),
                isCameraOff: Boolean(participant?.is_camera_off),
                isScreenSharing: update.kind === "screen" || Boolean(participant?.is_screen_sharing),
                status: participant?.status,
              },
            };
          });
        },
        onRemoteTrackRemoved: (participantId, trackId) => setRemoteTrackTiles((prev) => {
          const next = { ...prev };
          delete next[`${participantId}:${trackId}`];
          return next;
        }),
        onParticipantLeft: (participantId) => setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[participantId];
          setRemoteTrackTiles((current) => Object.fromEntries(Object.entries(current).filter(([, tile]) => tile.userId !== participantId)));
          return next;
        }),
      });
      roomRef.current = joinedRoom.room;
      liveKitTracksRef.current = joinedRoom.localTracks;
      setLocalStream(streamFromLocalTracks(joinedRoom.localTracks));
      void joinedRoom.room.startAudio().then(() => {
        setAudioPlaybackBlocked(false);
        setAudioPlaybackRetryToken((token) => token + 1);
      }).catch(() => setAudioPlaybackBlocked(true));
      setState("connected");
    } catch (err) {
      await Promise.resolve(sfuService.leaveRoom(roomRef.current, liveKitTracksRef.current)).catch(() => undefined);
      roomRef.current = null;
      liveKitTracksRef.current = [];
      socket.leaveCallRoom(joinedCall.id);
      setCurrentCall(null);
      setRemoteStreams({});
      await callApi.leaveCall(joinedCall.id, joinedCall.created_by === user.id ? "cancelled" : "left").catch(() => undefined);
      throw err;
    }
  }, [ensureCallConfig, setCurrentCall, socket, user.id]);

  const startDirectCall = useCallback(async (conversation: ChatConversation, kind: "audio" | "video") => {
    if (!conversation.other_user?.id || activeCallRef.current || pendingCallIntent) return;
    const token = startTokenRef.current + 1;
    startTokenRef.current = token;
    setPendingCallIntent({ conversation, kind, mode: "direct", direction: "outgoing", startedAt: Date.now() });
    setState("starting");
    try {
      setError("");
      const config = await ensureCallConfig();
      if (startTokenRef.current !== token) return;
      const preferSfu = kind === "video" && Boolean(config.sfu.configured && config.sfu.url);
      let stream: MediaStream | null = null;
      if (!preferSfu) {
        setState("requesting_permissions");
        stream = await ensureLocalStream(kind === "video");
        if (startTokenRef.current !== token) {
          webrtc.stopLocalMedia(stream);
          return;
        }
      }
      setState("dialing");
      const { call, sfu } = await callApi.startDirectCall({
        recipientUserId: conversation.other_user.id,
        conversationId: conversation.id,
        callType: kind,
        deviceId: getCurrentChatDeviceId(),
      });
      if (startTokenRef.current !== token) {
        void callApi.leaveCall(call.id, "cancelled").catch(() => undefined);
        return;
      }
      socket.joinCallRoom(call.id);
      setCurrentCall(call);
      setPendingCallIntent(null);
      if (kind === "video" && sfu) {
        if (stream) webrtc.stopLocalMedia(stream);
        setLocalStream(null);
        await joinSfu(call, sfu);
        setState("outgoing_ringing");
      } else {
        const peerStream = stream || await ensureLocalStream(kind === "video");
        ensurePeer(call, peerStream);
        setState("outgoing_ringing");
      }
    } catch (err) {
      setPendingCallIntent(null);
      setError(err instanceof Error ? err.message : "Could not start call");
      setState("failed");
    }
  }, [ensureCallConfig, ensureLocalStream, ensurePeer, joinSfu, pendingCallIntent, setCurrentCall, socket]);

  const startGroupCall = useCallback(async (conversation: ChatConversation, kind: "audio" | "video") => {
    if (activeCallRef.current || pendingCallIntent) return;
    const token = startTokenRef.current + 1;
    startTokenRef.current = token;
    setPendingCallIntent({ conversation, kind, mode: "group", direction: "outgoing", startedAt: Date.now() });
    setState("dialing");
    try {
      setError("");
      const config = await ensureCallConfig();
      if (!config.sfu.configured || !config.sfu.url) throw new Error("Group calling is not configured.");
      sfuService.assertBrowserCanReachSfuUrl(config.sfu.url);
      const result = await callApi.startGroupCall({ conversationId: conversation.id, callType: kind, deviceId: getCurrentChatDeviceId() });
      if (startTokenRef.current !== token) {
        void callApi.leaveCall(result.call.id, "cancelled").catch(() => undefined);
        return;
      }
      await joinSfu(result.call, result.sfu);
    } catch (err) {
      setPendingCallIntent(null);
      setError(err instanceof Error ? err.message : "Could not start group call");
      setState("failed");
    }
  }, [ensureCallConfig, joinSfu, pendingCallIntent]);

  const acceptIncoming = useCallback(async () => {
    if (!incomingCall) return;
    try {
      setError("");
      setCurrentCall(incomingCall);
      setIncomingCall(null);
      setState("requesting_permissions");
      if (incomingCall.call_mode === "group") {
        await joinSfu(incomingCall);
        return;
      }
      await ensureCallConfig();
      const shouldUseSfu = wantsVideo(incomingCall);
      const stream = shouldUseSfu ? null : await ensureLocalStream(false);
      socket.joinCallRoom(incomingCall.id);
      setState("connecting");
      if (stream) ensurePeer(incomingCall, stream);
      const { call, sfu } = await callApi.acceptCall(incomingCall.id, getCurrentChatDeviceId());
      if (wantsVideo(call) && sfu) {
        if (stream) webrtc.stopLocalMedia(stream);
        setLocalStream(null);
        await joinSfu(call, sfu);
        return;
      }
      const peerStream = stream || await ensureLocalStream(wantsVideo(call));
      ensurePeer(call, peerStream);
      setCurrentCall(call);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept call");
      setState("failed");
    }
  }, [ensureCallConfig, ensureLocalStream, ensurePeer, incomingCall, joinSfu, setCurrentCall, socket]);

  const rejectIncoming = useCallback(async () => {
    if (!incomingCall) return;
    const call = incomingCall;
    setIncomingCall(null);
    setState("idle");
    void callApi.rejectCall(call.id).catch((err) => setError(err instanceof Error ? err.message : "Could not reject call"));
  }, [incomingCall]);

  const joinGroupCall = useCallback(async (call = incomingCall || activeCall) => {
    if (!call) return;
    await joinSfu(call);
  }, [activeCall, incomingCall, joinSfu]);

  const endActiveCall = useCallback(async () => {
    const call = activeCall || incomingCall;
    if (!call && !pendingCallIntent) return;
    startTokenRef.current += 1;
    setIsEnding(true);
    setState("ending");
    const wasActive = Boolean(activeCall);
    const endState = state;
    await cleanup("ended");
    setIsEnding(false);
    if (!call) return;
    const request = wasActive
      ? callApi.leaveCall(call.id, endState === "outgoing_ringing" || endState === "dialing" ? "cancelled" : "left")
      : callApi.rejectCall(call.id);
    void request.catch((err) => setError(err instanceof Error ? err.message : "Could not end call"));
  }, [activeCall, cleanup, incomingCall, pendingCallIntent, state]);

  const toggleMute = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call || !localStream) return;
    const nextMuted = localStream.getAudioTracks().some((track) => track.enabled && track.readyState === "live");
    if (roomRef.current) {
      try {
        await roomRef.current.localParticipant.setMicrophoneEnabled(!nextMuted);
        syncLiveKitLocalTracks();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update microphone");
        return;
      }
    } else {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
    socket.emit("call:media-state", { call_id: call.id, is_muted: nextMuted });
  }, [localStream, socket, syncLiveKitLocalTracks]);

  const toggleCamera = useCallback(() => {
    const call = activeCallRef.current;
    if (!call || !localStream) return;
    const nextOff = localStream.getVideoTracks().some((track) => track.enabled);
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !nextOff;
    });
    socket.emit("call:media-state", { call_id: call.id, is_camera_off: nextOff });
  }, [localStream, socket]);

  const toggleScreenShare = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call) return;
    if (screenTracksRef.current.length) {
      liveKitScreenTracksRef.current.forEach((track) => {
        roomRef.current?.localParticipant.unpublishTrack(track).catch(() => undefined);
        track.stop();
      });
      liveKitScreenTracksRef.current = [];
      screenTracksRef.current.forEach((track) => track.stop());
      screenTracksRef.current = [];
      setLocalScreenStream(null);
      setIsScreenSharing(false);
      socket.emit("call:screen-share-stopped", { call_id: call.id });
      return;
    }
    if (roomRef.current) {
      const tracks = await sfuService.startScreenShare(roomRef.current);
      liveKitScreenTracksRef.current = tracks;
      screenTracksRef.current = tracks.map((track) => track.mediaStreamTrack);
      setLocalScreenStream(streamFromLocalTracks(tracks, Track.Source.ScreenShare));
      setIsScreenSharing(Boolean(tracks.length));
      tracks.forEach((track) => {
        track.mediaStreamTrack.addEventListener("ended", () => {
          liveKitScreenTracksRef.current = liveKitScreenTracksRef.current.filter((item) => item !== track);
          screenTracksRef.current = screenTracksRef.current.filter((item) => item !== track.mediaStreamTrack);
          setLocalScreenStream(null);
          setIsScreenSharing(false);
          socket.emit("call:screen-share-stopped", { call_id: call.id });
        }, { once: true });
      });
      socket.emit("call:screen-share-started", { call_id: call.id });
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Screen sharing is not supported by this browser.");
    const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const [screenTrack] = display.getVideoTracks();
    const sender = pcRef.current?.getSenders().find((item) => item.track?.kind === "video");
    if (sender && screenTrack) await sender.replaceTrack(screenTrack);
    screenTracksRef.current = screenTrack ? [screenTrack] : [];
    setLocalScreenStream(display);
    setIsScreenSharing(Boolean(screenTrack));
    screenTrack?.addEventListener("ended", () => {
      screenTracksRef.current = [];
      setLocalScreenStream(null);
      setIsScreenSharing(false);
      socket.emit("call:screen-share-stopped", { call_id: call.id });
    });
    socket.emit("call:screen-share-started", { call_id: call.id });
  }, [socket]);

  useEffect(() => {
    const offIncoming = socket.on("call:incoming", (payload) => {
      const call = (payload as { call?: CallRecord }).call;
      if (!call || call.created_by === user.id) return;
      if (call.call_mode === "group") {
        setIncomingCall(call);
        setState("incoming_ringing");
        return;
      }
      if (!activeCallRef.current) {
        setIncomingCall(call);
        setState("incoming_ringing");
      } else {
        socket.emit("call:reject", { call_id: call.id });
      }
    });

    const offAccepted = socket.on("call:accepted", async (payload) => {
      const call = (payload as { call?: CallRecord }).call;
      if (!call) return;
      setCurrentCall(call);
      if (call.call_mode === "direct" && call.created_by === user.id && !offeredCallIdsRef.current.has(call.id)) {
        offeredCallIdsRef.current.add(call.id);
        await ensureCallConfig();
        const stream = await ensureLocalStream(wantsVideo(call));
        const pc = ensurePeer(call, stream);
        const offer = await webrtc.createOffer(pc);
        socket.emit("call:offer", { call_id: call.id, to_user_id: otherParticipant(call, user.id)?.user_id, sdp: offer });
      }
      setState((current) => (current === "connected" ? current : "connecting"));
    });

    const offOffer = socket.on("call:offer", async (payload) => {
      const data = payload as { call_id?: string; sdp?: RTCSessionDescriptionInit; from_user_id?: string };
      const call = activeCallRef.current;
      if (!call || data.call_id !== call.id || !data.sdp) return;
      await ensureCallConfig();
      const stream = await ensureLocalStream(wantsVideo(call));
      const pc = ensurePeer(call, stream);
      const answer = await webrtc.handleOffer(pc, data.sdp);
      await flushPendingIceCandidates();
      socket.emit("call:answer", { call_id: call.id, to_user_id: data.from_user_id, sdp: answer });
      setState("connected");
    });

    const offAnswer = socket.on("call:answer", async (payload) => {
      const data = payload as { call_id?: string; sdp?: RTCSessionDescriptionInit };
      if (!pcRef.current || data.call_id !== activeCallRef.current?.id || !data.sdp) return;
      const applied = await webrtc.handleAnswer(pcRef.current, data.sdp);
      if (applied) {
        await flushPendingIceCandidates();
        setState("connected");
      }
    });

    const offIce = socket.on("call:ice-candidate", async (payload) => {
      const data = payload as { call_id?: string; candidate?: RTCIceCandidateInit };
      if (data.call_id !== activeCallRef.current?.id || !data.candidate) return;
      if (!pcRef.current?.remoteDescription) {
        pendingIceCandidatesRef.current.push(data.candidate);
        return;
      }
      await webrtc.addIceCandidate(pcRef.current, data.candidate).catch(() => undefined);
    });

    const mergeParticipantPatch = (payload: unknown) => {
      const data = payload as { call_id?: string; user_id?: string; participant?: Partial<CallParticipant> & { user_id?: string } };
      if (!data.call_id || data.call_id !== activeCallRef.current?.id || !data.participant?.user_id) return;
      const patch = data.participant;
      const apply = (current: CallRecord | null) => {
        if (!current || current.id !== data.call_id) return current;
        const participants = current.participants.map((participant) => (
          participant.user_id === patch.user_id ? { ...participant, ...patch, user: participant.user } : participant
        ));
        const next = { ...current, participants };
        activeCallRef.current = next;
        return next;
      };
      setActiveCall(apply);
      setIncomingCall(apply);
      setRemoteTrackTiles((current) => Object.fromEntries(Object.entries(current).map(([id, tile]) => (
        tile.userId === patch.user_id
          ? [id, {
              ...tile,
              isMuted: patch.is_muted ?? tile.isMuted,
              isCameraOff: patch.is_camera_off ?? tile.isCameraOff,
              isScreenSharing: patch.is_screen_sharing ?? tile.isScreenSharing,
              status: patch.status ?? tile.status,
            }]
          : [id, tile]
      ))));
    };

    const mergeCall = (payload: unknown) => {
      const call = (payload as { call?: CallRecord }).call;
      if (!call) return;
      setActiveCall((current) => {
        if (current?.id === call.id) {
          activeCallRef.current = call;
          return call;
        }
        return current;
      });
      setIncomingCall((current) => (current?.id === call.id ? call : current));
    };
    const offJoined = socket.on("call:joined", mergeCall);
    const offParticipant = socket.on("call:participant-updated", (payload) => {
      mergeCall(payload);
      mergeParticipantPatch(payload);
    });
    const offMediaState = socket.on("call:media-state", mergeParticipantPatch);
    const offScreenStarted = socket.on("call:screen-share-started", mergeParticipantPatch);
    const offScreenStopped = socket.on("call:screen-share-stopped", mergeParticipantPatch);
    const offRejected = socket.on("call:rejected", async (payload) => {
      mergeCall(payload);
      await cleanup("rejected");
    });
    const offEnded = socket.on("call:ended", async (payload) => {
      mergeCall(payload);
      await cleanup("ended");
    });
    const offCancelled = socket.on("call:cancelled", async (payload) => {
      mergeCall(payload);
      await cleanup("ended");
    });
    const offMissed = socket.on("call:missed", async () => cleanup("missed"));

    return () => {
      offIncoming?.();
      offAccepted?.();
      offOffer?.();
      offAnswer?.();
      offIce?.();
      offJoined?.();
      offParticipant?.();
      offMediaState?.();
      offScreenStarted?.();
      offScreenStopped?.();
      offRejected?.();
      offEnded?.();
      offCancelled?.();
      offMissed?.();
    };
  }, [cleanup, ensureCallConfig, ensureLocalStream, ensurePeer, flushPendingIceCandidates, setCurrentCall, socket, user.id]);

  const value = useMemo<CallContextValue>(() => ({
    activeCall,
    incomingCall,
    pendingCallIntent,
    state,
    error,
    isEnding,
    durationSeconds,
    localStream,
    localScreenStream,
    remoteStreams,
    remoteTrackTiles,
    isScreenSharing,
    audioPlaybackBlocked,
    audioPlaybackRetryToken,
    startDirectCall,
    startGroupCall,
    acceptIncoming,
    rejectIncoming,
    joinGroupCall,
    endActiveCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    enableRemoteAudio,
  }), [
    acceptIncoming,
    activeCall,
    audioPlaybackBlocked,
    audioPlaybackRetryToken,
    durationSeconds,
    enableRemoteAudio,
    endActiveCall,
    error,
    incomingCall,
    isEnding,
    joinGroupCall,
    localStream,
    localScreenStream,
    pendingCallIntent,
    rejectIncoming,
    remoteStreams,
    remoteTrackTiles,
    isScreenSharing,
    startDirectCall,
    startGroupCall,
    state,
    toggleCamera,
    toggleMute,
    toggleScreenShare,
  ]);

  return (
    <CallContext.Provider value={value}>
      {children}
      <IncomingCallModal />
      <CallScreen />
      <CallNotice />
    </CallContext.Provider>
  );
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function VideoPane({
  stream,
  playbackMuted,
  micMuted,
  label,
  className = "",
  cameraOff,
  screen,
  actions,
}: {
  stream: MediaStream | null;
  playbackMuted?: boolean;
  micMuted?: boolean;
  label: string;
  className?: string;
  cameraOff?: boolean;
  screen?: boolean;
  actions?: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasVideo = Boolean(stream?.getVideoTracks().length && !cameraOff);

  useEffect(() => {
    if (hasVideo && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      void video.play().catch(() => undefined);
    }
  }, [stream, hasVideo]);

  useEffect(() => {
    if (!hasVideo && audioRef.current) {
      const audio = audioRef.current;
      audio.srcObject = stream;
      void audio.play().catch(() => undefined);
    }
  }, [stream, hasVideo]);

  return (
    <div className={`relative min-h-44 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 ${className}`}>
      {hasVideo ? (
        <video ref={videoRef} autoPlay playsInline muted={playbackMuted} className={`h-full min-h-44 w-full ${screen ? "object-contain bg-black" : "object-cover"}`} />
      ) : (
        <div className="grid h-full min-h-44 place-items-center text-center text-sm text-zinc-500">
          <div className="grid place-items-center gap-3 px-4">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-zinc-800 text-xl font-semibold text-zinc-200">
              {label.replace(/^@/, "").trim()[0]?.toUpperCase() || <SpeakerWaveIcon className="h-8 w-8 text-zinc-600" />}
            </div>
            <span>{cameraOff ? "Camera is off" : label}</span>
          </div>
          {stream && (
            <audio ref={audioRef} autoPlay playsInline muted={playbackMuted} className="sr-only" />
          )}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-3">
        <span className="min-w-0 truncate rounded-md bg-black/55 px-2 py-1 text-xs font-medium text-white">
          {label}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {micMuted ? <span title="Microphone muted" className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-zinc-200"><NoSymbolIcon className="h-4 w-4" /></span> : null}
          {screen ? <span title="Screen sharing" className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-zinc-950"><ComputerDesktopIcon className="h-4 w-4" /></span> : null}
        </span>
      </div>
      {actions ? <div className="absolute right-3 top-3 flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

function RemoteAudioSink({ retryToken, stream }: { retryToken: number; stream: MediaStream }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioTrackSignature = stream.getAudioTracks().map((track) => `${track.id}:${track.enabled}:${track.readyState}`).join("|");

  useEffect(() => {
    const audio = audioRef.current;
    const audioTracks = stream.getAudioTracks();
    if (!audio || !audioTracks.length) return;
    audio.srcObject = new MediaStream(audioTracks);
    audio.muted = false;
    audio.volume = 1;
    void audio.play().catch(() => undefined);
    return () => {
      audio.pause();
      audio.srcObject = null;
    };
  }, [audioTrackSignature, retryToken, stream]);

  if (!audioTrackSignature) return null;
  return <audio ref={audioRef} autoPlay playsInline className="sr-only" />;
}

function RemoteAudioStreams({
  currentUserId,
  remoteStreams,
  enabled,
  retryToken,
}: {
  currentUserId: string;
  remoteStreams: Record<string, MediaStream>;
  enabled: boolean;
  retryToken: number;
}) {
  if (!enabled) return null;
  return (
    <>
      {Object.entries(remoteStreams).map(([userId, stream]) => (
        userId === currentUserId || !stream.getAudioTracks().length ? null : (
          <RemoteAudioSink key={userId} retryToken={retryToken} stream={stream} />
        )
      ))}
    </>
  );
}

export function ParticipantTile({ participant, stream }: { participant?: CallParticipant | null; stream: MediaStream | null }) {
  return <VideoPane stream={stream} label={participant?.user?.username ? `@${participant.user.username}` : "Participant"} />;
}

export function NetworkQualityIndicator({ state }: { state: CallUiState }) {
  const color = state === "connected" ? "text-emerald-400" : state === "reconnecting" ? "text-amber-400" : "text-zinc-500";
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
      <SignalIcon className="h-4 w-4" />
      {state.replace(/_/g, " ")}
    </span>
  );
}

export function CallControls({
  onToggleParticipants,
  onToggleLayout,
  participantsOpen,
}: {
  onToggleParticipants?: () => void;
  onToggleLayout?: () => void;
  participantsOpen?: boolean;
}) {
  const { activeCall, endActiveCall, isEnding, isScreenSharing, localStream, pendingCallIntent, toggleCamera, toggleMute, toggleScreenShare } = useCalls();
  const callType = activeCall?.call_type || pendingCallIntent?.kind || "audio";
  const muted = !localStream?.getAudioTracks().some((track) => track.enabled);
  const cameraOff = callType.includes("audio") || !localStream?.getVideoTracks().some((track) => track.enabled);
  const mediaControlsDisabled = !activeCall || isEnding;
  return (
    <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3 shadow-lg backdrop-blur-md">
      <button title={muted ? "Unmute microphone" : "Mute microphone"} onClick={toggleMute} disabled={mediaControlsDisabled} className="grid h-12 w-12 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 transition-colors disabled:cursor-not-allowed disabled:opacity-30">
        {muted ? <NoSymbolIcon className="h-5 w-5 text-zinc-400" /> : <MicrophoneIcon className="h-5 w-5 text-emerald-400" />}
      </button>
      <button title={cameraOff ? "Enable camera" : "Disable camera"} onClick={toggleCamera} disabled={mediaControlsDisabled || callType.includes("audio")} className="grid h-12 w-12 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        {cameraOff ? <VideoCameraSlashIcon className="h-5 w-5 text-zinc-400" /> : <VideoCameraIcon className="h-5 w-5 text-sky-400" />}
      </button>
      <button title={isScreenSharing ? "Stop sharing" : "Share screen"} onClick={toggleScreenShare} disabled={mediaControlsDisabled} className={`grid h-12 w-12 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${isScreenSharing ? "border-emerald-500 bg-emerald-500 text-zinc-950" : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"}`}>
        <ComputerDesktopIcon className="h-5 w-5" />
      </button>
      {onToggleLayout ? (
        <button title="Switch layout" onClick={onToggleLayout} disabled={mediaControlsDisabled} className="grid h-12 w-12 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30">
          <Squares2X2Icon className="h-5 w-5" />
        </button>
      ) : null}
      {onToggleParticipants ? (
        <button title={participantsOpen ? "Hide participants" : "Show participants"} onClick={onToggleParticipants} disabled={mediaControlsDisabled} className={`grid h-12 w-12 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${participantsOpen ? "border-sky-500 bg-sky-500 text-zinc-950" : "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800"}`}>
          <UserGroupIcon className="h-5 w-5" />
        </button>
      ) : null}
      <span className="mx-1 h-8 w-px bg-zinc-800" />
      <button title={activeCall ? "Leave call" : "Cancel call"} onClick={endActiveCall} disabled={isEnding} className="grid h-12 w-12 place-items-center rounded-full bg-rose-600 text-white hover:bg-rose-500 transition-all hover:scale-105 shadow-md shadow-rose-900/30 disabled:cursor-not-allowed disabled:opacity-60">
        <PhoneArrowDownLeftIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

export function DeviceSelector() {
  return null;
}

function IncomingCallModal() {
  const { acceptIncoming, incomingCall, rejectIncoming } = useCalls();
  if (!incomingCall) return null;
  const title = incomingCall.call_mode === "group" ? "Group call" : "Incoming call";
  return (
    <div className="fixed inset-x-4 top-5 z-[70] mx-auto max-w-sm rounded-lg border border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black/40">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-xs text-zinc-500">{incomingCall.call_type.includes("video") ? "Video" : "Audio"} call</p>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={rejectIncoming} className="inline-flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900">
          <XMarkIcon className="h-4 w-4" /> Reject
        </button>
        <button onClick={acceptIncoming} className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-950">
          <PhoneArrowUpRightIcon className="h-4 w-4" /> Accept
        </button>
      </div>
    </div>
  );
}

export function OutgoingCallModal() {
  const { activeCall, endActiveCall, pendingCallIntent, state } = useCalls();
  if ((!activeCall && !pendingCallIntent) || !["starting", "requesting_permissions", "dialing", "outgoing_ringing"].includes(state)) return null;
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-sm font-semibold text-white">Calling…</p>
      <button onClick={endActiveCall} className="mt-3 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white">Cancel</button>
    </div>
  );
}

function callStatusCopy(state: CallUiState, activeCall: CallRecord | null, pendingCallIntent: PendingCallIntent | null, isEnding: boolean) {
  if (isEnding || state === "ending") return "Ending call...";
  if (state === "starting") return "Starting call...";
  if (state === "requesting_permissions") return pendingCallIntent?.kind === "video" || wantsVideo(activeCall) ? "Allow microphone and camera access" : "Allow microphone access";
  if (state === "dialing") return "Setting up secure media...";
  if (state === "outgoing_ringing") return "Ringing...";
  if (state === "incoming_ringing") return "Incoming call";
  if (state === "connecting") return "Connecting...";
  if (state === "reconnecting") return "Reconnecting...";
  if (state === "connected") return "Connected";
  if (state === "failed") return "Call failed";
  if (state === "rejected") return "Call declined";
  if (state === "missed") return "Missed call";
  return activeCall || pendingCallIntent ? "Preparing call..." : "Call";
}

function CallTileView({
  tile,
  pinned,
  onPin,
  compact,
}: {
  tile: CallTile;
  pinned?: boolean;
  onPin?: () => void;
  compact?: boolean;
}) {
  return (
    <VideoPane
      stream={tile.stream}
      playbackMuted={tile.isLocal}
      micMuted={tile.isMuted}
      label={tile.label}
      cameraOff={tile.kind === "camera" && tile.isCameraOff}
      screen={tile.kind === "screen"}
      className={compact ? "aspect-video min-h-28" : "aspect-video min-h-52"}
      actions={onPin ? (
        <button
          type="button"
          onClick={onPin}
          title={pinned ? "Unpin tile" : "Pin tile"}
          className={`grid h-9 w-9 place-items-center rounded-full border text-white backdrop-blur transition-colors ${pinned ? "border-sky-400 bg-sky-500/90" : "border-white/15 bg-black/45 hover:bg-black/70"}`}
        >
          <ArrowsPointingOutIcon className="h-4 w-4" />
        </button>
      ) : null}
    />
  );
}

function ParticipantsPanel({ call, currentUserId }: { call: CallRecord | null; currentUserId: string }) {
  const participants = call?.participants || [];
  return (
    <aside className="h-full w-full border-l border-zinc-800 bg-zinc-950/95 text-white lg:w-80">
      <div className="border-b border-zinc-800 px-4 py-3">
        <p className="text-sm font-semibold">Participants</p>
        <p className="mt-1 text-xs text-zinc-500">{participants.length} in this call</p>
      </div>
      <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-2 py-2">
        {participants.map((participant) => {
          const name = participant.user_id === currentUserId ? "You" : nameForParticipant(participant);
          return (
            <div key={participant.id || participant.user_id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-900">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-200">
                {name.replace(/^@/, "")[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">{name}</p>
                <p className="truncate text-xs text-zinc-500">{participant.status.replace(/_/g, " ")}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-zinc-400">
                {participant.is_muted ? <NoSymbolIcon title="Muted" className="h-4 w-4" /> : <MicrophoneIcon title="Mic on" className="h-4 w-4 text-emerald-400" />}
                {participant.is_camera_off ? <VideoCameraSlashIcon title="Camera off" className="h-4 w-4" /> : <VideoCameraIcon title="Camera on" className="h-4 w-4 text-sky-400" />}
                {participant.is_screen_sharing ? <ComputerDesktopIcon title="Screen sharing" className="h-4 w-4 text-emerald-400" /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function CallScreen() {
  const {
    activeCall,
    audioPlaybackBlocked,
    audioPlaybackRetryToken,
    durationSeconds,
    enableRemoteAudio,
    error,
    isEnding,
    localScreenStream,
    localStream,
    pendingCallIntent,
    remoteStreams,
    remoteTrackTiles,
    state,
  } = useCalls();
  const [manualPinnedTileId, setManualPinnedTileId] = useState<string | null>(null);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [forceGrid, setForceGrid] = useState(false);
  if (!activeCall && !pendingCallIntent && !isEnding) return null;
  const tiles = buildCallTiles({
    call: activeCall,
    currentUserId: activeCall?.current_user_participant?.user_id || activeCall?.participants.find((participant) => participant.user_id === activeCall.created_by)?.user_id || "",
    localStream,
    localScreenStream,
    remoteStreams,
    remoteTrackTiles,
  });
  const currentUserId = activeCall?.current_user_participant?.user_id || tiles.find((tile) => tile.isLocal)?.userId || "";
  const visibleTiles = tiles.filter((tile) => tile.stream || tile.isLocal || tile.status !== "left");
  const pinnedTileId = selectPinnedTileId(visibleTiles, manualPinnedTileId, forceGrid);
  const pinnedTile = pinnedTileId ? visibleTiles.find((tile) => tile.id === pinnedTileId) : undefined;
  const gridTiles = pinnedTile ? visibleTiles.filter((tile) => tile.id !== pinnedTile.id) : visibleTiles;
  const mode = activeCall?.call_mode || pendingCallIntent?.mode || "direct";
  const title = mode === "group" ? "Group call" : "Direct call";
  const statusCopy = callStatusCopy(state, activeCall, pendingCallIntent, isEnding);
  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950 text-white">
      <div className="flex h-full min-h-0">
        <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs text-zinc-500">{statusCopy} · {formatDuration(durationSeconds)}</p>
          </div>
          <NetworkQualityIndicator state={state} />
        </header>
        {error ? <div className="mx-4 mt-3 shrink-0 rounded-lg border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">{error}</div> : null}
        {audioPlaybackBlocked ? (
          <div className="mx-4 mt-3 flex shrink-0 items-center justify-between gap-3 rounded-lg border border-amber-700/70 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
            <span>Audio playback is blocked by the browser.</span>
            <button type="button" onClick={() => void enableRemoteAudio()} className="shrink-0 rounded-md bg-amber-300 px-3 py-1 text-xs font-semibold text-zinc-950">
              Enable audio
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-hidden px-3 py-3 sm:px-5">
          {pinnedTile ? (
            <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-3">
              <CallTileView
                tile={pinnedTile}
                pinned
                onPin={() => setManualPinnedTileId(manualPinnedTileId === pinnedTile.id ? null : pinnedTile.id)}
              />
              <div className="flex min-h-32 gap-3 overflow-x-auto pb-1">
                {gridTiles.map((tile) => (
                  <div key={tile.id} className="w-52 shrink-0 sm:w-64">
                    <CallTileView
                      tile={tile}
                      compact
                      pinned={manualPinnedTileId === tile.id}
                      onPin={() => setManualPinnedTileId(manualPinnedTileId === tile.id ? null : tile.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : visibleTiles.length ? (
            <div className={`grid h-full min-h-0 content-center gap-3 overflow-y-auto ${visibleTiles.length <= 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"}`}>
              {visibleTiles.map((tile) => (
                <CallTileView
                  key={tile.id}
                  tile={tile}
                  pinned={manualPinnedTileId === tile.id}
                  onPin={() => setManualPinnedTileId(manualPinnedTileId === tile.id ? null : tile.id)}
                />
              ))}
            </div>
          ) : (
            <div className="grid h-full place-items-center rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-zinc-500">
              <div className="grid place-items-center gap-3 text-center">
                <PhoneIcon className="h-10 w-10 text-zinc-700" />
                <span>{statusCopy}</span>
              </div>
            </div>
          )}
        </div>
        <div className="shrink-0 px-3 pb-4 sm:px-5">
          <CallControls
            participantsOpen={participantsOpen}
            onToggleParticipants={() => setParticipantsOpen((open) => !open)}
            onToggleLayout={() => {
              setForceGrid((current) => !current);
              setManualPinnedTileId(null);
            }}
          />
        </div>
        </main>
        <RemoteAudioStreams
          currentUserId={currentUserId}
          remoteStreams={remoteStreams}
          enabled={Boolean(activeCall && (activeCall.call_mode === "group" || activeCall.call_type === "direct_video"))}
          retryToken={audioPlaybackRetryToken}
        />
        {participantsOpen ? <ParticipantsPanel call={activeCall} currentUserId={currentUserId} /> : null}
      </div>
    </div>
  );
}

function CallNotice() {
  const { activeCall, error, pendingCallIntent } = useCalls();
  if (!error || activeCall || pendingCallIntent) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-[75] max-w-sm -translate-x-1/2 rounded-lg border border-rose-900 bg-rose-950 px-4 py-3 text-sm text-rose-100 shadow-xl">
      {error}
    </div>
  );
}

export function MiniCallWindow() {
  const { activeCall, durationSeconds, endActiveCall } = useCalls();
  if (!activeCall) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[55] rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-white shadow-xl">
      <p className="text-xs text-zinc-500">{formatDuration(durationSeconds)}</p>
      <button onClick={endActiveCall} className="mt-2 rounded bg-rose-600 px-2 py-1 text-xs font-semibold">End</button>
    </div>
  );
}

export function ConversationCallControls({ conversation }: { conversation: ChatConversation | null }) {
  const { activeCall, pendingCallIntent, startDirectCall, startGroupCall } = useCalls();
  if (!conversation || activeCall || pendingCallIntent) return null;
  const start = conversation.type === "group" ? startGroupCall : startDirectCall;
  return (
    <div className="flex items-center gap-1">
      <button
        title="Start audio call"
        onClick={() => start(conversation, "audio")}
        className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-800 text-zinc-200 hover:bg-zinc-900"
      >
        <PhoneIcon className="h-4 w-4" />
      </button>
      <button
        title="Start video call"
        onClick={() => start(conversation, "video")}
        className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-800 text-zinc-200 hover:bg-zinc-900"
      >
        <VideoCameraIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function OngoingGroupCallBanner({ conversation }: { conversation: ChatConversation | null }) {
  const { activeCall, joinGroupCall } = useCalls();
  if (!conversation || conversation.type !== "group" || !activeCall || activeCall.conversation_id !== conversation.id || activeCall.call_mode !== "group") return null;
  return (
    <div className="flex items-center justify-between border-b border-emerald-900/60 bg-emerald-950/20 px-5 py-2 text-sm">
      <span className="text-emerald-300">Group call in progress</span>
      <button onClick={() => joinGroupCall(activeCall)} className="rounded-lg border border-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-100 hover:bg-emerald-900/40">Join</button>
    </div>
  );
}

export class CallErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <div className="p-3 text-sm text-rose-300">Call controls could not load.</div>;
    return this.props.children;
  }
}
