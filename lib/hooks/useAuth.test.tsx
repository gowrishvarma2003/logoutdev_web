import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "./useAuth";
import { getCurrentUser } from "../api";
import { signOutFirebase } from "../firebase";

vi.mock("../firebase", () => ({
  signOutFirebase: vi.fn(async () => undefined),
}));

vi.mock("../api", () => ({
  getCurrentUser: vi.fn(),
}));

describe("useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = "logoutdev_test=; Max-Age=0; path=/";
    window.history.pushState({}, "", "/");
    vi.mocked(getCurrentUser).mockReset();
    vi.mocked(signOutFirebase).mockClear();
  });

  it("hydrates cached user immediately then refreshes chat crypto flags from the server", async () => {
    localStorage.setItem("authToken", "token-1");
    localStorage.setItem("currentUser", JSON.stringify({
      id: "user-1",
      name: "Deepak",
      email: "deepak@example.com",
      chat_encryption_enabled: false,
    }));

    let resolveCurrentUser!: (value: Awaited<ReturnType<typeof getCurrentUser>>) => void;
    vi.mocked(getCurrentUser).mockReturnValue(new Promise((resolve) => {
      resolveCurrentUser = resolve;
    }));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.user?.chat_encryption_enabled).toBe(false));
    expect(result.current.isLoaded).toBe(true);

    resolveCurrentUser({
      user: {
        id: "user-1",
        name: "Deepak",
        email: "deepak@example.com",
        chat_encryption_enabled: true,
        chat_crypto_version: 2,
        chat_recovery_enabled: true,
      },
    });

    await waitFor(() => expect(result.current.user?.chat_encryption_enabled).toBe(true));
    expect(result.current.user?.chat_crypto_version).toBe(2);
    expect(JSON.parse(localStorage.getItem("currentUser") || "{}").chat_recovery_enabled).toBe(true);
  });

  it("clears all browser-readable session data on logout", async () => {
    localStorage.setItem("authToken", "token-1");
    localStorage.setItem("currentUser", JSON.stringify({ id: "user-1", name: "Deepak" }));
    localStorage.setItem("logoutdev.chat.vault.v2", "{}");
    localStorage.setItem("other-local", "value");
    sessionStorage.setItem("logoutdev.chat.recovery-key", "1234");
    sessionStorage.setItem("other-session", "value");
    document.cookie = "logoutdev_test=value; path=/";
    window.history.pushState({}, "", "/app");
    vi.mocked(getCurrentUser).mockReturnValue(new Promise(() => undefined));

    const redirects: string[] = [];
    const onRedirect = (event: Event) => {
      event.preventDefault();
      redirects.push((event as CustomEvent<{ path: string }>).detail.path);
    };
    window.addEventListener("logoutdev:redirect", onRedirect);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    window.removeEventListener("logoutdev:redirect", onRedirect);

    expect(signOutFirebase).toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).not.toContain("logoutdev_test=");
    expect(redirects).toEqual(["/login"]);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});
