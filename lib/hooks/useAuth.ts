"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoaded: boolean;
}

/**
 * Reads the current auth state from localStorage and exposes a logout helper.
 * Safe to call on the server (will always return isLoaded: false until mounted).
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoaded: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const raw = localStorage.getItem("currentUser");

    let user: User | null = null;
    if (raw) {
      try {
        user = JSON.parse(raw) as User;
      } catch {
        // Corrupted — ignore
      }
    }

    setState({ user, token, isLoaded: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    // Hard navigate so all state is wiped
    window.location.href = "/login";
  }, []);

  const refreshUser = useCallback((updated: User) => {
    localStorage.setItem("currentUser", JSON.stringify(updated));
    setState((prev) => ({ ...prev, user: updated }));
  }, []);

  return { ...state, logout, refreshUser };
}
