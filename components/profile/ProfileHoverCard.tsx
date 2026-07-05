"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { useProfile, useProfileSignals } from "@/lib/hooks/useProfile";
import { getCachedProfile, setCachedProfile, getCachedSignals, setCachedSignals } from "@/lib/profileCache";
import type { User, ProofOfWorkBand } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const SHOW_DELAY_MS = 500;
const HIDE_DELAY_MS = 0;

const BAND_COLORS: Record<ProofOfWorkBand, string> = {
  Strong: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  Growing: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  Early: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

const STAT_ITEMS: Array<{ key: string; label: string; get: (s: NonNullable<ReturnType<typeof useProfile>["stats"]>) => number }> = [
  { key: "followers", label: "Followers", get: (s) => s.followers },
  { key: "following", label: "Following", get: (s) => s.following },
  { key: "repos", label: "Repos", get: (s) => s.repos_count ?? 0 },
  { key: "projects", label: "Projects", get: (s) => (s.projects_created_count ?? 0) + (s.projects_contributed_count ?? 0) },
];

interface CachedHoverData {
  stats: NonNullable<ReturnType<typeof useProfile>["stats"]> | null;
  band: ProofOfWorkBand | null;
  badge: string | null;
  score: number | null;
  skills: string[];
}

function useHoverProfile(username: string): CachedHoverData & { loading: boolean } {
  const cached = getCachedProfile(username);
  const cachedSignals = getCachedSignals(username);

  const [cachedData] = useState<CachedHoverData | null>(() => {
    if (!cached || !cachedSignals) return null;
    return {
      stats: cached.stats as CachedHoverData["stats"],
      band: cachedSignals.band as ProofOfWorkBand | null,
      badge: cachedSignals.badge,
      score: cachedSignals.score,
      skills: (cached.skills ?? []).sort((a, b) => a.rank - b.rank).slice(0, 4).map((s) => s.skill),
    };
  });

  const { profile, stats, skills, loading: profileLoading } = useProfile(username);
  const { signals, loading: signalsLoading } = useProfileSignals(username);

  useEffect(() => {
    if (!profileLoading && profile) {
      setCachedProfile(username, {
        profile: profile as unknown as Record<string, unknown>,
        stats: stats as unknown as Record<string, number> | null,
        skills: skills as unknown as Array<{ skill: string; rank: number }>,
      });
    }
  }, [username, profileLoading, profile, stats, skills]);

  useEffect(() => {
    if (!signalsLoading && signals) {
      setCachedSignals(username, {
        band: signals.band ?? null,
        badge: signals.badge ?? null,
        score: signals.score ?? null,
      });
    }
  }, [username, signalsLoading, signals]);

  if (cachedData) {
    return { ...cachedData, loading: false };
  }

  const loading = profileLoading || signalsLoading;
  const band = signals?.band ?? null;
  const badge = signals?.badge ?? null;
  const score = signals?.score ?? null;
  const topSkills = (skills ?? []).sort((a, b) => a.rank - b.rank).slice(0, 4).map((s) => s.skill);

  return { stats, band, badge, score, skills: topSkills, loading };
}

function ProfileHoverCardContent({
  username,
  user,
  onClose,
  onKeepOpen,
  hoverData,
}: {
  username: string;
  user: User | null | undefined;
  onClose: () => void;
  onKeepOpen: () => void;
  hoverData: CachedHoverData & { loading: boolean };
}) {
  const bio = user?.bio ?? "";
  const truncatedBio = bio.length > 120 ? `${bio.slice(0, 120)}…` : bio;

  return (
    <div
      className="absolute left-0 top-full z-30 mt-2 w-80 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl"
      onMouseEnter={onKeepOpen}
      onMouseLeave={onClose}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Link
            href={`/profile/${username}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          >
            <Avatar user={user ?? null} size="lg" />
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={`/profile/${username}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-bold text-zinc-100 hover:underline break-words"
            >
              {user?.name ?? "Unknown"}
            </Link>
            <p className="text-xs text-zinc-500">@{username}</p>

            {user?.headline && (
              <p className="mt-0.5 text-xs text-zinc-300 leading-snug">{user.headline}</p>
            )}
          </div>
        </div>

        {truncatedBio && (
          <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed">{truncatedBio}</p>
        )}

        {hoverData.loading && (
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
            <Spinner size="sm" />
            Loading...
          </div>
        )}

        {!hoverData.loading && (
          <>
            {(hoverData.band || hoverData.badge) && (
              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BAND_COLORS[hoverData.band ?? "Early"]}`}
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {hoverData.badge || hoverData.band}
                  {hoverData.score != null && (
                    <span className="font-mono opacity-80">· {Math.round(hoverData.score)}</span>
                  )}
                </span>
              </div>
            )}

            {hoverData.stats && (
              <div className="mt-3 grid grid-cols-4 gap-1">
                {STAT_ITEMS.map((item) => (
                  <div key={item.key} className="text-center">
                    <p className="text-sm font-bold text-zinc-100 tabular-nums">
                      {item.get(hoverData.stats!)}
                    </p>
                    <p className="text-[10px] text-zinc-500 leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
            )}

            {hoverData.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {hoverData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-zinc-800 px-4 py-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-zinc-500">
        {user?.location && (
          <span className="inline-flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            {user.location}
          </span>
        )}
        {user?.website_url && (
          <a
            href={user.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sky-400 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            {user.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        )}
        {user?.created_at && (
          <span>Joined {formatRelativeTime(user.created_at)}</span>
        )}
      </div>
    </div>
  );
}

interface ProfileHoverCardProps {
  username: string;
  user: User | null | undefined;
  children: ReactNode;
}

export default function ProfileHoverCard({ username, user, children }: ProfileHoverCardProps) {
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    showTimerRef.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
  };

  const handleMouseLeave = () => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), HIDE_DELAY_MS);
  };

  const handleKeepOpen = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  return (
    <span
      className="relative inline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {visible && (
        <>
          <div
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => {
              if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
              setVisible(false);
            }}
          />
          <HoverCardInner
            username={username}
            user={user}
            onClose={() => setVisible(false)}
            onKeepOpen={handleKeepOpen}
          />
        </>
      )}
    </span>
  );
}

function HoverCardInner({
  username,
  user,
  onClose,
  onKeepOpen,
}: {
  username: string;
  user: User | null | undefined;
  onClose: () => void;
  onKeepOpen: () => void;
}) {
  const hoverData = useHoverProfile(username);
  return (
    <ProfileHoverCardContent
      username={username}
      user={user}
      onClose={onClose}
      onKeepOpen={onKeepOpen}
      hoverData={hoverData}
    />
  );
}
