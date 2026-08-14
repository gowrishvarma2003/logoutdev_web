"use client";

/**
 * Advanced Settings Page - /settings/advanced
 * Manage advanced storage, system settings, and beta features
 */

import StorageUsageBreakdown from "@/components/settings/StorageUsageBreakdown";
import BetaFeatureCard from "@/components/settings/BetaFeatureCard";
import SettingsSection from "@/components/settings/SettingsSection";
import { useBetaFeatures } from "@/lib/hooks/useBetaFeatures";
import { BETA_FEATURES } from "@/lib/constants/betaFeatures";
import { SparklesIcon } from "@heroicons/react/24/outline";

export default function AdvancedSettingsPage() {
  // Beta features hook
  const { enabledFeatures, isLoading, toggleFeature } = useBetaFeatures();

  // Mock data: ~2.4GB used of 5GB limit
  const mockStorageUsage = {
    usage: {
      images: 950 * 1024 * 1024, // 950 MB
      documents: 560 * 1024 * 1024, // 560 MB
      code: 650 * 1024 * 1024, // 650 MB
      other: 240 * 1024 * 1024, // 240 MB
    },
    limit: 5 * 1024 * 1024 * 1024, // 5 GB
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Advanced Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage storage usage, system resources, and experimental features
        </p>
      </div>

      {/* Storage Usage Section */}
      <StorageUsageBreakdown
        usage={mockStorageUsage.usage}
        limit={mockStorageUsage.limit}
      />

      {/* Beta Features Section */}
      {!isLoading && (
        <SettingsSection
          title="Beta Features"
          description="Opt-in to experimental and upcoming features. High-risk features may have bugs or breaking changes."
          icon={<SparklesIcon className="w-5 h-5" />}
        >
          <div className="space-y-3">
            {BETA_FEATURES.map((feature) => (
              <BetaFeatureCard
                key={feature.id}
                feature={feature}
                enabled={enabledFeatures[feature.id] ?? false}
                onToggle={toggleFeature}
              />
            ))}
          </div>

          {/* Beta Features Info */}
          <div className="mt-4 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
            <p className="text-xs text-zinc-400">
              <span className="font-semibold text-zinc-300">💡 Note:</span> Beta
              features may change or be removed without notice. Your feedback
              helps us improve LogoutDev. Report issues on GitHub or contact
              support.
            </p>
          </div>
        </SettingsSection>
      )}
    </div>
  );
}
