"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ComputerDesktopIcon,
  MicrophoneIcon,
  NoSymbolIcon,
  PhoneArrowDownLeftIcon,
  PhoneArrowUpRightIcon,
  PhoneIcon,
  SignalIcon,
  SpeakerWaveIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import type { LocalTrack, Room } from "livekit-client";
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

interface CallContextValue {
  activeCall: CallRecord | null;
  incomingCall: CallRecord | null;
  pendingCallIntent: PendingCallIntent | null;
  state: CallUiState;
  error: string;
  isEnding: boolean;
  durationSeconds: number;
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>;
  startDirectCall: (conversation: ChatConversation, kind: "audio" | "video") => Promise<void>;
  startGroupCall: (conversation: ChatConversation, kind: "audio" | "video") => Promise<void>;
  acceptIncoming: () => Promise<void>;
  rejectIncoming: () => Promise<void>;
  joinGroupCall: (call?: CallRecord) => Promise<void>;
  endActiveCall: () => Promise<void>;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => Promise<void>;
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

function streamFromLocalTracks(tracks: LocalTrack[]) {
  return new MediaStream(tracks.map((track) => track.mediaStreamTrack).filter(Boolean));
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
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [durationSeconds, setDurationSeconds] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const roomRef = useRef<Room | null>(null);
  const liveKitTracksRef = useRef<LocalTrack[]>([]);
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
    await Promise.resolve(sfuService.leaveRoom(roomRef.current, liveKitTracksRef.current)).catch(() => undefined);
    roomRef.current = null;
    liveKitTracksRef.current = [];
    webrtc.stopLocalMedia(localStream);
    setLocalStream(null);
    setRemoteStreams({});
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
        onRemoteStream: (participantId, stream) => setRemoteStreams((prev) => ({ ...prev, [participantId]: stream })),
        onParticipantLeft: (participantId) => setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[participantId];
          return next;
        }),
      });
      roomRef.current = joinedRoom.room;
      liveKitTracksRef.current = joinedRoom.localTracks;
      setLocalStream(streamFromLocalTracks(joinedRoom.localTracks));
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
      await ensureCallConfig();
      if (startTokenRef.current !== token) return;
      setState("requesting_permissions");
      const stream = await ensureLocalStream(kind === "video");
      if (startTokenRef.current !== token) {
        webrtc.stopLocalMedia(stream);
        return;
      }
      setState("dialing");
      const { call } = await callApi.startDirectCall({
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
      ensurePeer(call, stream);
      setState("outgoing_ringing");
    } catch (err) {
      setPendingCallIntent(null);
      setError(err instanceof Error ? err.message : "Could not start call");
      setState("failed");
    }
  }, [ensureCallConfig, ensureLocalStream, ensurePeer, pendingCallIntent, setCurrentCall, socket]);

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
      const stream = await ensureLocalStream(wantsVideo(incomingCall));
      socket.joinCallRoom(incomingCall.id);
      setState("connecting");
      ensurePeer(incomingCall, stream);
      const { call } = await callApi.acceptCall(incomingCall.id, getCurrentChatDeviceId());
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

  const toggleMute = useCallback(() => {
    const call = activeCallRef.current;
    if (!call || !localStream) return;
    const nextMuted = localStream.getAudioTracks().some((track) => track.enabled);
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    socket.emit("call:media-state", { call_id: call.id, is_muted: nextMuted });
  }, [localStream, socket]);

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
      screenTracksRef.current.forEach((track) => track.stop());
      screenTracksRef.current = [];
      socket.emit("call:screen-share-stopped", { call_id: call.id });
      return;
    }
    if (call.call_mode === "group") {
      const tracks = await sfuService.startScreenShare(roomRef.current);
      screenTracksRef.current = tracks.map((track) => track.mediaStreamTrack);
      socket.emit("call:screen-share-started", { call_id: call.id });
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("Screen sharing is not supported by this browser.");
    const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const [screenTrack] = display.getVideoTracks();
    const sender = pcRef.current?.getSenders().find((item) => item.track?.kind === "video");
    if (sender && screenTrack) await sender.replaceTrack(screenTrack);
    screenTracksRef.current = screenTrack ? [screenTrack] : [];
    screenTrack?.addEventListener("ended", () => {
      screenTracksRef.current = [];
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
    const offParticipant = socket.on("call:participant-updated", mergeCall);
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
    remoteStreams,
    startDirectCall,
    startGroupCall,
    acceptIncoming,
    rejectIncoming,
    joinGroupCall,
    endActiveCall,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
  }), [
    acceptIncoming,
    activeCall,
    durationSeconds,
    endActiveCall,
    error,
    incomingCall,
    isEnding,
    joinGroupCall,
    localStream,
    pendingCallIntent,
    rejectIncoming,
    remoteStreams,
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

function VideoPane({ stream, muted, label }: { stream: MediaStream | null; muted?: boolean; label: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasVideo = Boolean(stream?.getVideoTracks().length);

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
    <div className="relative min-h-44 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      {hasVideo ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full min-h-44 w-full object-cover" />
      ) : (
        <div className="grid min-h-44 place-items-center text-sm text-zinc-500">
          <SpeakerWaveIcon className="mb-2 h-8 w-8 text-zinc-700" />
          {label}
          {stream && (
            <audio ref={audioRef} autoPlay playsInline muted={muted} className="sr-only" />
          )}
        </div>
      )}
      <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs text-white">{label}</span>
    </div>
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

export function CallControls() {
  const { activeCall, endActiveCall, isEnding, localStream, pendingCallIntent, toggleCamera, toggleMute, toggleScreenShare } = useCalls();
  const callType = activeCall?.call_type || pendingCallIntent?.kind || "audio";
  const muted = !localStream?.getAudioTracks().some((track) => track.enabled);
  const cameraOff = callType.includes("audio") || !localStream?.getVideoTracks().some((track) => track.enabled);
  const mediaControlsDisabled = !activeCall || isEnding;
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-3 px-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md shadow-lg max-w-sm mx-auto w-full">
      <button title={muted ? "Unmute microphone" : "Mute microphone"} onClick={toggleMute} disabled={mediaControlsDisabled} className="grid h-12 w-12 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 transition-colors disabled:cursor-not-allowed disabled:opacity-30">
        {muted ? <NoSymbolIcon className="h-5 w-5 text-zinc-400" /> : <MicrophoneIcon className="h-5 w-5 text-emerald-400" />}
      </button>
      <button title={cameraOff ? "Enable camera" : "Disable camera"} onClick={toggleCamera} disabled={mediaControlsDisabled || callType.includes("audio")} className="grid h-12 w-12 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        {cameraOff ? <VideoCameraSlashIcon className="h-5 w-5 text-zinc-400" /> : <VideoCameraIcon className="h-5 w-5 text-sky-400" />}
      </button>
      <button title="Share screen" onClick={toggleScreenShare} disabled={mediaControlsDisabled} className="grid h-12 w-12 place-items-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 transition-colors disabled:cursor-not-allowed disabled:opacity-30">
        <ComputerDesktopIcon className="h-5 w-5 text-zinc-200" />
      </button>
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

function CallScreen() {
  const { activeCall, durationSeconds, error, isEnding, localStream, pendingCallIntent, remoteStreams, state } = useCalls();
  if (!activeCall && !pendingCallIntent && !isEnding) return null;
  const remoteEntries = Object.entries(remoteStreams);
  const mode = activeCall?.call_mode || pendingCallIntent?.mode || "direct";
  const title = mode === "group" ? "Group call" : "Direct call";
  const statusCopy = callStatusCopy(state, activeCall, pendingCallIntent, isEnding);
  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950/95 p-4 text-white backdrop-blur">
      <div className="mx-auto flex h-full max-w-6xl flex-col justify-between">
        <header className="flex items-center justify-between border-b border-zinc-800 pb-3 shrink-0">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs text-zinc-500">{statusCopy} · {formatDuration(durationSeconds)}</p>
          </div>
          <NetworkQualityIndicator state={state} />
        </header>
        {error ? <div className="mt-3 rounded-lg border border-rose-900 bg-rose-950/40 px-3 py-2 text-sm text-rose-200 shrink-0">{error}</div> : null}
        <div className="grid flex-1 content-center gap-3 py-4 grid-cols-1 sm:grid-cols-2 overflow-y-auto min-h-0">
          <VideoPane stream={localStream} muted label="You" />
          {remoteEntries.length ? remoteEntries.map(([id, stream]) => (
            <ParticipantTile key={id} participant={activeCall?.participants.find((participant) => participant.user_id === id)} stream={stream} />
          )) : (
            <div className="grid min-h-44 place-items-center rounded-lg border border-zinc-800 bg-zinc-950 text-sm text-zinc-500">
              <PhoneIcon className="mb-2 h-8 w-8 text-zinc-700" />
              {statusCopy}
            </div>
          )}
        </div>
        <div className="pt-2 shrink-0">
          <CallControls />
        </div>
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
