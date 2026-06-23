"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "../types";
import { signOutFirebase, getCurrentFirebaseIdToken } from "../firebase";
import { firebaseLogin, getCurrentUser } from "../api";
import * as requestCache from "../services/requestCache";

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

      if (token && user) {
        setState({ user, token, isLoaded: true });
        return;
      }

      if (token && !user) {
        try {
          const { user: fetchedUser } = await getCurrentUser();
          if (cancelled) return;
          localStorage.setItem("currentUser", JSON.stringify(fetchedUser));
          setState({ user: fetchedUser, token, isLoaded: true });
        } catch {
          localStorage.removeItem("authToken");
          localStorage.removeItem("currentUser");
          setState({ user: null, token: null, isLoaded: true });
        }
        return;
      }

      if (!token && !user) {
        try {
          const fbToken = await getCurrentFirebaseIdToken();
          if (fbToken && !cancelled) {
            const data = await firebaseLogin(fbToken);
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("currentUser", JSON.stringify(data.user));
            setState({ user: data.user, token: data.token, isLoaded: true });
            return;
          }
        } catch {
          // Firebase not signed in either - stay logged out
        }
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
    // Clear any cached user-scoped data so the next signed-in user can't see
    // the previous user's spaces/repos caches.
    requestCache.clear();
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    window.location.href = "/login";
  }, []);

  const refreshUser = useCallback((updated: User) => {
    localStorage.setItem("currentUser", JSON.stringify(updated));
    setState((prev) => ({ ...prev, user: updated }));
  }, []);

  return { ...state, logout, refreshUser };
}