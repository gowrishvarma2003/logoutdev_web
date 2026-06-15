"use client";

/**
 * useProfile — collection of hooks for Developer Profile data fetching.
 * Follows the same useAsync pattern as useSpaces.ts.
 */

import { useCallback, useEffect, useState } from "react";
import type {
  ProfileResponse,
  ProofOfWorkSignals,
  UserFeaturedProject,
  Post,
  ProjectSpace,
  ActivityItem,
  Launch,
  FreelanceProject,
  FreelanceProposal,
} from "../types";
import * as api from "../services/profilesApi";

// ─── Generic async hook ───────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setState({ data: null, loading: false, error: msg });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}

// ─── Profile Hooks ────────────────────────────────────────────────────────────

/** Full profile overview — stats, skills, featured projects */
export function useProfile(username: string) {
  const result = useAsync<ProfileResponse>(
    () => api.getProfile(username),
    [username]
  );
  return {
    profile: result.data?.profile ?? null,
    is_me: result.data?.is_me ?? false,
    is_following: result.data?.is_following ?? false,
    stats: result.data?.stats ?? null,
    skills: result.data?.skills ?? [],
    featured_projects: result.data?.featured_projects ?? [],
    career_summary: result.data?.career_summary ?? null,
    fit_clusters: result.data?.fit_clusters ?? [],
    open_to_collaborate: result.data?.open_to_collaborate ?? false,
    related_entities: result.data?.related_entities ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

/** Proof-of-work score and factor breakdown */
export function useProfileSignals(username: string) {
  const result = useAsync<{ signals: ProofOfWorkSignals }>(
    () => api.getProfileSignals(username),
    [username]
  );
  return {
    signals: result.data?.signals ?? null,
    loading: result.loading,
    error: result.error,
  };
}

/** Paginated projects (owned + contributed) */
export function useProfileProjects(username: string, page = 1) {
  const result = useAsync<{
    projects: ProjectSpace[];
    total: number;
    page: number;
    limit: number;
  }>(() => api.getProfileProjects(username, page), [username, page]);
  return {
    projects: result.data?.projects ?? [],
    total: result.data?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

/** Paginated posts (no replies) */
export function useProfilePosts(username: string, page = 1) {
  const result = useAsync<{
    posts: Post[];
    total: number;
    page: number;
    limit: number;
  }>(() => api.getProfilePosts(username, page), [username, page]);
  return {
    posts: result.data?.posts ?? [],
    total: result.data?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

/** Paginated unified activity timeline */
export function useProfileActivity(username: string, page = 1) {
  const result = useAsync<{
    activity: ActivityItem[];
    total: number;
    page: number;
    limit: number;
  }>(() => api.getProfileActivity(username, page), [username, page]);
  return {
    activity: result.data?.activity ?? [],
    total: result.data?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useProfileLaunches(username: string) {
  const result = useAsync<{ launches: Launch[] }>(
    () => api.getProfileLaunches(username),
    [username]
  );
  return {
    launches: result.data?.launches ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

export function useProfileFreelance(username: string) {
  const result = useAsync<{ client_projects: FreelanceProject[]; wins: FreelanceProposal[] }>(
    () => api.getProfileFreelance(username),
    [username]
  );
  return {
    client_projects: result.data?.client_projects ?? [],
    wins: result.data?.wins ?? [],
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}

// ─── Mutation hooks ───────────────────────────────────────────────────────────

interface MutationState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

/** PATCH /me — update profile metadata */
export function useUpdateProfile() {
  const [state, setState] = useState<MutationState>({
    loading: false,
    error: null,
    success: false,
  });

  const update = useCallback(
    async (updates: Parameters<typeof api.patchMyProfile>[0]) => {
      setState({ loading: true, error: null, success: false });
      try {
        const { profile } = await api.patchMyProfile(updates);
        // Refresh localStorage user entry for sidebar / auth context
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem("currentUser");
          if (raw) {
            const current = JSON.parse(raw);
            localStorage.setItem(
              "currentUser",
              JSON.stringify({ ...current, ...profile })
            );
          }
        }
        setState({ loading: false, error: null, success: true });
        return profile;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update profile";
        setState({ loading: false, error: msg, success: false });
        return null;
      }
    },
    []
  );

  return { ...state, update };
}

/** PUT /me/skills — replace skills list */
export function useUpdateSkills() {
  const [state, setState] = useState<MutationState>({
    loading: false,
    error: null,
    success: false,
  });

  const updateSkills = useCallback(async (skills: string[]) => {
    setState({ loading: true, error: null, success: false });
    try {
      const { skills: saved } = await api.replaceMySkills(skills);
      setState({ loading: false, error: null, success: true });
      return saved;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update skills";
      setState({ loading: false, error: msg, success: false });
      return null;
    }
  }, []);

  return { ...state, updateSkills };
}

/** PUT /me/featured-projects — set pinned spaces */
export function useUpdateFeaturedProjects() {
  const [state, setState] = useState<MutationState>({
    loading: false,
    error: null,
    success: false,
  });

  const updateFeatured = useCallback(async (spaceIds: string[]) => {
    setState({ loading: true, error: null, success: false });
    try {
      const { featured_projects } = await api.replaceMyFeaturedProjects(spaceIds);
      setState({ loading: false, error: null, success: true });
      return featured_projects;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update featured projects";
      setState({ loading: false, error: msg, success: false });
      return null as unknown as UserFeaturedProject[];
    }
  }, []);

  return { ...state, updateFeatured };
}
