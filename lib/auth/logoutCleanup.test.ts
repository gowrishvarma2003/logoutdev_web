import { describe, expect, it } from "vitest";
import { clearClientSession } from "./logoutCleanup";

describe("logout cleanup", () => {
  it("clears local storage, session storage, readable cookies, and is idempotent", () => {
    localStorage.setItem("authToken", "token-1");
    localStorage.setItem("currentUser", "{}");
    localStorage.setItem("logoutdev.chat.vault.v2", "{}");
    sessionStorage.setItem("logoutdev.chat.recovery-key", "1234");
    sessionStorage.setItem("temporary", "value");
    document.cookie = "logoutdev_test=value; path=/";

    clearClientSession();
    clearClientSession();

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).not.toContain("logoutdev_test=");
  });
});
