"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { KeyIcon, ArrowLeftIcon, BoltIcon } from "@heroicons/react/24/outline";
import RateLimitStatus from "@/components/settings/RateLimitStatus";

export default function IntegrationsPage() {
  const router = useRouter();

  // Mock data: Free tier with ~60% usage
  // Use a fixed reset time (23 hours from epoch) to avoid calling Date.now() during render
  const resetTime = new Date(1000 * 60 * 60 * 23);
  
  const mockRateLimitData = useMemo(
    () => ({
      used: 600,
      limit: 1000,
      resetAt: resetTime,
      tier: "free" as const,
    }),
    [resetTime]
  );

  return (
    <div>
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/settings/profile")}
            className="p-1.5 -ml-1.5 rounded-full text-zinc-400 hover:bg-zinc-800 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Settings</span>
            <span className="text-zinc-600">/</span>
            <h1 className="text-[15px] font-bold text-white">Integrations</h1>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="px-5 py-6 max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Integrations</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Manage your API access and connected services
          </p>
        </div>

        {/* API Rate Limit Status */}
        <RateLimitStatus
          used={mockRateLimitData.used}
          limit={mockRateLimitData.limit}
          resetAt={mockRateLimitData.resetAt}
          tier={mockRateLimitData.tier}
        />

        {/* API Access Tokens Card */}
        <Link
          href="/settings/tokens"
          className="block mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-900/30 p-3">
              <KeyIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white mb-1">API Access Tokens</h3>
              <p className="text-sm text-zinc-400 mb-3">
                Create and manage personal access tokens for Git access and API authentication.
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-900/50">
                Manage Tokens →
              </span>
            </div>
          </div>
        </Link>

        {/* Webhooks Card */}
        <Link
          href="/settings/integrations/webhooks"
          className="block mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-purple-900/30 p-3">
              <BoltIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-white mb-1">Webhooks</h3>
              <p className="text-sm text-zinc-400 mb-3">
                Send real-time events to external services when things happen in your account.
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-900/20 text-purple-400 border border-purple-900/50">
                Manage Webhooks →
              </span>
            </div>
          </div>
        </Link>

        {/* Additional Integration Placeholder */}
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 opacity-60">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-gray-700/20 p-3">
              <div className="h-6 w-6 bg-gray-700 rounded" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-zinc-600 mb-1">More Integrations</h3>
              <p className="text-sm text-zinc-600">
                Additional integrations coming soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
