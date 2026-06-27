"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "../types";
import { signOutFirebase } from "../firebase";
import { getCurrentUser } from "../api";
import { clearClientSession, clearClientSessionAndRedirect } from "../auth/logoutCleanup";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoaded: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoaded: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const token = localStorage.getItem("authToken");
      const raw = localStorage.getItem("currentUser");

      let user: User | null = null;
      if (raw) {
        try {
          user = JSON.parse(raw) as User;
        } catch {
          // Corrupted - ignore
        }
      }

      if (token) {
        if (user) {
          setState({ user, token, isLoaded: true });
        }

        try {
          const { user: fetchedUser } = await getCurrentUser();
          if (cancelled) return;
          localStorage.setItem("currentUser", JSON.stringify(fetchedUser));
          setState({ user: fetchedUser, token, isLoaded: true });
        } catch {
          if (user && localStorage.getItem("authToken")) {
            if (!cancelled) setState({ user, token, isLoaded: true });
            return;
          }
          clearClientSession();
          setState({ user: null, token: null, isLoaded: true });
        }
        return;
      }

      if (!cancelled) {
        setState({ user: null, token: null, isLoaded: true });
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOutFirebase();
    } catch {
      // Ignore Firebase sign-out errors
    }
    setState({ user: null, token: null, isLoaded: true });
    clearClientSessionAndRedirect("/login");
  }, []);

  const refreshUser = useCallback((updated: User) => {
    localStorage.setItem("currentUser", JSON.stringify(updated));
    setState((prev) => ({ ...prev, user: updated }));
  }, []);

  return { ...state, logout, refreshUser };
}
