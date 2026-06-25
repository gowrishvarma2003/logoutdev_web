import { describe, expect, it, vi } from "vitest";
import { handleAnswer, stopLocalMedia } from "./webrtcService";

describe("webrtcService", () => {
  it("stops every local media track during cleanup", () => {
    const tracks = [
      { stop: vi.fn() },
      { stop: vi.fn() },
    ] as unknown as MediaStreamTrack[];
    const stream = { getTracks: () => tracks } as unknown as MediaStream;

    stopLocalMedia(stream);

    expect(tracks[0].stop).toHaveBeenCalledTimes(1);
    expect(tracks[1].stop).toHaveBeenCalledTimes(1);
  });

  it("accepts null streams for idempotent cleanup", () => {
    expect(() => stopLocalMedia(null)).not.toThrow();
  });

  it("ignores late duplicate answers once signaling is stable", async () => {
    const pc = {
      signalingState: "stable",
      setRemoteDescription: vi.fn(),
    } as unknown as RTCPeerConnection;

    await expect(handleAnswer(pc, { type: "answer", sdp: "v=0" })).resolves.toBe(false);
    expect(pc.setRemoteDescription).not.toHaveBeenCalled();
  });

  it("applies answers only while a local offer is pending", async () => {
    const pc = {
      signalingState: "have-local-offer",
      setRemoteDescription: vi.fn().mockResolvedValue(undefined),
    } as unknown as RTCPeerConnection;

    await expect(handleAnswer(pc, { type: "answer", sdp: "v=0" })).resolves.toBe(true);
    expect(pc.setRemoteDescription).toHaveBeenCalledTimes(1);
  });
});
