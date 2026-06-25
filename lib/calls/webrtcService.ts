export interface PeerCallbacks {
  onRemoteStream?: (stream: MediaStream) => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
  onConnectionState?: (state: RTCPeerConnectionState) => void;
}

export async function getLocalMedia(options: { audio: boolean; video: boolean; deviceId?: string | null }) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support media capture.");
  }
  return navigator.mediaDevices.getUserMedia({
    audio: options.audio,
    video: options.video ? (options.deviceId ? { deviceId: { exact: options.deviceId } } : true) : false,
  });
}

export function stopLocalMedia(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function createPeerConnection(iceServers: RTCIceServer[] = [], callbacks: PeerCallbacks = {}) {
  const pc = new RTCPeerConnection({ iceServers });
  pc.onicecandidate = (event) => {
    if (event.candidate) callbacks.onIceCandidate?.(event.candidate);
  };
  pc.ontrack = (event) => {
    const stream = event.streams[0] || new MediaStream([event.track]);
    callbacks.onRemoteStream?.(stream);
  };
  pc.onconnectionstatechange = () => callbacks.onConnectionState?.(pc.connectionState);
  return pc;
}

export function addLocalTracks(pc: RTCPeerConnection, stream: MediaStream) {
  const currentTrackIds = new Set(pc.getSenders().map((sender) => sender.track?.id).filter(Boolean));
  stream.getTracks().forEach((track) => {
    if (!currentTrackIds.has(track.id)) pc.addTrack(track, stream);
  });
}

export async function createOffer(pc: RTCPeerConnection) {
  const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
  await pc.setLocalDescription(offer);
  return offer;
}

export async function handleOffer(pc: RTCPeerConnection, offer: RTCSessionDescriptionInit) {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function handleAnswer(pc: RTCPeerConnection, answer: RTCSessionDescriptionInit) {
  if (pc.signalingState !== "have-local-offer") return false;
  await pc.setRemoteDescription(answer);
  return true;
}

export async function addIceCandidate(pc: RTCPeerConnection, candidate: RTCIceCandidateInit) {
  if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(candidate));
}

export async function switchCamera(stream: MediaStream, deviceId?: string | null) {
  const next = await getLocalMedia({ audio: false, video: true, deviceId });
  const [nextVideo] = next.getVideoTracks();
  const [oldVideo] = stream.getVideoTracks();
  if (oldVideo) {
    stream.removeTrack(oldVideo);
    oldVideo.stop();
  }
  if (nextVideo) stream.addTrack(nextVideo);
  return nextVideo || null;
}
