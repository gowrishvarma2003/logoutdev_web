import { describe, expect, it } from "vitest";
import { assertBrowserCanReachSfuUrl } from "./sfuService";

const remotePage = { protocol: "https:", hostname: "logoutdev.unineeds.in" } as Location;
const localPage = { protocol: "http:", hostname: "localhost" } as Location;

describe("sfuService URL validation", () => {
  it("rejects localhost LiveKit URLs for remote browser pages", () => {
    expect(() => assertBrowserCanReachSfuUrl("ws://localhost:7880", remotePage)).toThrow(/localhost/i);
  });

  it("rejects insecure public LiveKit URLs from secure pages", () => {
    expect(() => assertBrowserCanReachSfuUrl("ws://livekit.example.com", remotePage)).toThrow(/wss/i);
  });

  it("allows local LiveKit URLs for local browser pages", () => {
    expect(() => assertBrowserCanReachSfuUrl("ws://localhost:7880", localPage)).not.toThrow();
  });

  it("allows secure public LiveKit URLs for secure pages", () => {
    expect(() => assertBrowserCanReachSfuUrl("wss://livekit.example.com", remotePage)).not.toThrow();
  });
});
