import {
  createLocalScreenTracks,
  createLocalTracks,
  Room,
  RoomEvent,
  Track,
  type LocalTrack,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from "livekit-client";
import type { SfuJoinDetails } from "@/lib/types";

type SfuConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected" | "failed";
export type SfuTrackKind = "camera" | "screen" | "audio";

export interface SfuTrackUpdate {
  participantId: string;
  trackId: string;
  kind: SfuTrackKind;
  stream: MediaStream;
}

export interface SfuCallbacks {
  onRemoteStream?: (participantId: string, stream: MediaStream) => void;
  onRemoteTrack?: (update: SfuTrackUpdate) => void;
  onRemoteTrackRemoved?: (participantId: string, trackId: string) => void;
  onParticipantLeft?: (participantId: string) => void;
  onConnectionState?: (state: SfuConnectionState) => void;
  onAudioPlaybackStatus?: (playing: boolean) => void;
  onError?: (error: Error) => void;
}

export interface SfuJoinOptions {
  audio: boolean;
  video: boolean;
  iceServers?: RTCIceServer[];
  connectTimeoutMs?: number;
}

function isLoopbackHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return normalized === "localhost" || normalized === "0.0.0.0" || normalized === "::1" || normalized.startsWith("127.");
}

export function assertBrowserCanReachSfuUrl(url: string, pageLocation = typeof window !== "undefined" ? window.location : null) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Group media server URL is invalid. Check LIVEKIT_PUBLIC_URL.");
  }

  if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
    throw new Error("Group media server URL must use ws:// or wss://. Check LIVEKIT_PUBLIC_URL.");
  }

  if (!pageLocation) return;
  const pageIsLoopback = isLoopbackHost(pageLocation.hostname);
  const mediaIsLoopback = isLoopbackHost(parsed.hostname);

  if (mediaIsLoopback && !pageIsLoopback) {
    throw new Error("Group media server is configured as localhost. Set LIVEKIT_PUBLIC_URL to a public LiveKit wss:// URL for remote users.");
  }

  if (pageLocation.protocol === "https:" && parsed.protocol === "ws:" && !mediaIsLoopback) {
    throw new Error("Secure pages require a secure LiveKit URL. Set LIVEKIT_PUBLIC_URL to wss://.");
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

function normalizeSfuError(error: unknown, url: string) {
  const message = error instanceof Error ? error.message : "Failed to establish connection.";
  let host = "the group media server";
  try {
    host = new URL(url).host;
  } catch {
    // Keep the generic host label.
  }
  return new Error(`Could not connect to ${host}. ${message}`);
}

function publicationKind(publication: RemoteTrackPublication): SfuTrackKind {
  if (publication.source === Track.Source.ScreenShare) return "screen";
  if (publication.kind === Track.Kind.Audio) return "audio";
  return "camera";
}

export async function joinRoom(details: SfuJoinDetails, options: SfuJoinOptions, callbacks: SfuCallbacks = {}) {
  assertBrowserCanReachSfuUrl(details.url);
  const room = new Room({ adaptiveStream: true, dynacast: true });
  const remoteStreams = new Map<string, MediaStream>();
  const remoteTrackStreams = new Map<string, MediaStream>();

  room.on(RoomEvent.Connected, () => callbacks.onConnectionState?.("connected"));
  room.on(RoomEvent.Reconnecting, () => callbacks.onConnectionState?.("reconnecting"));
  room.on(RoomEvent.SignalReconnecting, () => callbacks.onConnectionState?.("reconnecting"));
  room.on(RoomEvent.Reconnected, () => callbacks.onConnectionState?.("connected"));
  room.on(RoomEvent.Disconnected, () => callbacks.onConnectionState?.("disconnected"));
  room.on(RoomEvent.ConnectionStateChanged, (connectionState) => {
    callbacks.onConnectionState?.(String(connectionState) as SfuConnectionState);
  });
  room.on(RoomEvent.AudioPlaybackStatusChanged, (playing) => callbacks.onAudioPlaybackStatus?.(playing));
  room.on(RoomEvent.MediaDevicesError, (error) => callbacks.onError?.(error));

  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication: RemoteTrackPublication, participant: RemoteParticipant) => {
    if (track.kind !== Track.Kind.Audio && track.kind !== Track.Kind.Video) return;
    const stream = remoteStreams.get(participant.identity) || new MediaStream();
    stream.addTrack(track.mediaStreamTrack);
    remoteStreams.set(participant.identity, stream);
    callbacks.onRemoteStream?.(participant.identity, stream);

    const trackStream = new MediaStream([track.mediaStreamTrack]);
    const trackId = _publication.trackSid || track.mediaStreamTrack.id;
    remoteTrackStreams.set(`${participant.identity}:${trackId}`, trackStream);
    callbacks.onRemoteTrack?.({
      participantId: participant.identity,
      trackId,
      kind: publicationKind(_publication),
      stream: trackStream,
    });
  });

  room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
    const trackId = publication.trackSid || track.mediaStreamTrack.id;
    remoteTrackStreams.delete(`${participant.identity}:${trackId}`);
    const stream = remoteStreams.get(participant.identity);
    if (stream) {
      stream.removeTrack(track.mediaStreamTrack);
      if (stream.getTracks().length) callbacks.onRemoteStream?.(participant.identity, stream);
      else remoteStreams.delete(participant.identity);
    }
    callbacks.onRemoteTrackRemoved?.(participant.identity, trackId);
  });

  room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
    remoteStreams.delete(participant.identity);
    for (const key of Array.from(remoteTrackStreams.keys())) {
      if (key.startsWith(`${participant.identity}:`)) remoteTrackStreams.delete(key);
    }
    callbacks.onParticipantLeft?.(participant.identity);
  });

  const tracks: LocalTrack[] = [];
  try {
    await withTimeout(
      room.connect(details.url, details.token, options.iceServers?.length ? { rtcConfig: { iceServers: options.iceServers } } : undefined),
      options.connectTimeoutMs || 15000,
      "Timed out while connecting to the group media server."
    );
    const localTracks = await createLocalTracks({ audio: options.audio, video: options.video });
    tracks.push(...localTracks);
    for (const track of tracks) {
      await room.localParticipant.publishTrack(track);
    }
  } catch (error) {
    tracks.forEach((track) => track.stop());
    room.disconnect();
    callbacks.onConnectionState?.("failed");
    throw normalizeSfuError(error, details.url);
  }

  return { room, localTracks: tracks, remoteStreams };
}

export async function leaveRoom(room: Room | null, localTracks: LocalTrack[] = []) {
  localTracks.forEach((track) => track.stop());
  room?.disconnect();
}

export async function startScreenShare(room: Room | null) {
  if (!room) return [];
  const tracks = await createLocalScreenTracks({ audio: false });
  for (const track of tracks) {
    await room.localParticipant.publishTrack(track);
  }
  return tracks;
}
