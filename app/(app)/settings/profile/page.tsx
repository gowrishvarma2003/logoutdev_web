"use client";

/**
 * Settings → Profile page — /settings/profile
 * Allows the authenticated user to edit their developer profile.
 */

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useProfile } from "@/lib/hooks/useProfile";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon, UserIcon, KeyIcon } from "@/components/ui/Icons";
import type { User } from "@/lib/types";

export default function SettingsProfilePage() {
  const router = useRouter();
  const { user: currentUser, isLoaded, refreshUser } = useAuth();

  // Use current user's username (or id fallback) to fetch full profile data
  const profileSlug = currentUser?.username || currentUser?.id || "";

  const {
    profile,
    skills,
    featured_projects,
    loading,
    error,
    refetch,
  } = useProfile(profileSlug);

  if (!isLoaded || !currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleSaved = (updated: User) => {
    // Refresh localStorage / auth context so sidebar shows updated name / username
    refreshUser(updated);
    // Redirect to their new profile
    const newSlug = updated.username || updated.id;
    router.push(`/profile/${newSlug}`);
  };

  return (
    <div>
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1.5 rounded-full text-zinc-400 hover:bg-zinc-800 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-zinc-400" />
            <h1 className="text-[15px] font-bold text-white">Edit Profile</h1>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="px-5 py-6">
        <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">Git Access Tokens</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Create tokens for cloning and pushing private space repositories over HTTPS.
              </p>
            </div>
            <Link
              href="/settings/tokens"
              className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <KeyIcon className="w-3.5 h-3.5" />
              Manage
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-rose-400 text-sm mb-3">{error}</p>
            <button
              onClick={refetch}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Try again
            </button>
          </div>
        ) : (
          <ProfileEditForm
            profile={profile ?? currentUser}
            initialSkills={skills}
            initialFeatured={featured_projects}
            onSaved={handleSaved}
          />
        )}
      </div>
    </div>
  );
}
