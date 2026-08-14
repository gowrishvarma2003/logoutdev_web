/**
 * BetaFeatureCard - Individual beta feature toggle card
 * Displays feature info, risk level, and enable/disable toggle
 */

'use client';

import { useMemo } from 'react';
import { BetaFeature, getRiskColor, getRiskBgColor } from '@/lib/constants/betaFeatures';

interface BetaFeatureCardProps {
  feature: BetaFeature;
  enabled: boolean;
  onToggle: (featureId: string, enabled: boolean) => void;
}

export default function BetaFeatureCard({
  feature,
  enabled,
  onToggle,
}: BetaFeatureCardProps) {
  const riskColor = useMemo(() => getRiskColor(feature.risk), [feature.risk]);
  const riskBgColor = useMemo(() => getRiskBgColor(feature.risk), [feature.risk]);
  const riskLabel = useMemo(() => {
    return feature.risk.charAt(0).toUpperCase() + feature.risk.slice(1);
  }, [feature.risk]);

  const handleToggle = () => {
    onToggle(feature.id, !enabled);
  };

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        enabled
          ? 'border-zinc-700 bg-zinc-900/50'
          : 'border-zinc-800 bg-zinc-950/30'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-white">
                  {feature.name}
                </h3>
                {feature.isNew && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    New
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 mt-1">{feature.description}</p>
            </div>
          </div>

          {/* Risk Level Badge */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${riskBgColor} ${riskColor}`}
            >
              Risk: {riskLabel}
            </span>

            {/* High Risk Warning */}
            {feature.risk === 'high' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                High Risk
              </span>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <div className="flex-shrink-0 pt-1">
          <button
            onClick={handleToggle}
            aria-pressed={enabled}
            aria-label={`${enabled ? 'Disable' : 'Enable'} ${feature.name}`}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              enabled ? 'bg-emerald-600' : 'bg-zinc-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 focus:ring-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
