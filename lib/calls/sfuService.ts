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

export interface SfuCallbacks {
  onRemoteStream?: (participantId: string, stream: MediaStream) => void;
  onParticipantLeft?: (participantId: string) => void;
}

export async function joinRoom(details: SfuJoinDetails, options: { audio: boolean; video: boolean }, callbacks: SfuCallbacks = {}) {
  const room = new Room({ adaptiveStream: true, dynacast: true });
  const remoteStreams = new Map<string, MediaStream>();

  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication: RemoteTrackPublication, participant: RemoteParticipant) => {
    if (track.kind !== Track.Kind.Audio && track.kind !== Track.Kind.Video) return;
    const stream = remoteStreams.get(participant.identity) || new MediaStream();
    stream.addTrack(track.mediaStreamTrack);
    remoteStreams.set(participant.identity, stream);
    callbacks.onRemoteStream?.(participant.identity, stream);
  });

  room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
    remoteStreams.delete(participant.identity);
    callbacks.onParticipantLeft?.(participant.identity);
  });

  await room.connect(details.url, details.token);
  const tracks = await createLocalTracks({ audio: options.audio, video: options.video });
  for (const track of tracks) {
    await room.localParticipant.publishTrack(track);
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
