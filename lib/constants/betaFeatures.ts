/**
 * Beta Features Configuration
 * Defines all available beta features with their metadata
 */

export type BetaFeatureRisk = 'low' | 'medium' | 'high';

export interface BetaFeature {
  id: string;
  name: string;
  description: string;
  risk: BetaFeatureRisk;
  isNew: boolean;
}

export const BETA_FEATURES: BetaFeature[] = [
  {
    id: 'ai-suggestions',
    name: 'AI Code Suggestions',
    description: 'Get AI-powered coding assistance and intelligent code completions',
    risk: 'low',
    isNew: true,
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Detailed profile insights and activity metrics for your development',
    risk: 'low',
    isNew: false,
  },
  {
    id: 'experimental-ui',
    name: 'Experimental UI',
    description: 'Try new interface designs and improved visual components',
    risk: 'medium',
    isNew: true,
  },
  {
    id: 'beta-api',
    name: 'Beta API Access',
    description: 'Access unreleased API endpoints and experimental features',
    risk: 'high',
    isNew: false,
  },
];

export const getRiskColor = (risk: BetaFeatureRisk): string => {
  switch (risk) {
    case 'low':
      return 'text-emerald-400';
    case 'medium':
      return 'text-amber-400';
    case 'high':
      return 'text-rose-400';
    default:
      return 'text-zinc-400';
  }
};

export const getRiskBgColor = (risk: BetaFeatureRisk): string => {
  switch (risk) {
    case 'low':
      return 'bg-emerald-500/10 border-emerald-500/20';
    case 'medium':
      return 'bg-amber-500/10 border-amber-500/20';
    case 'high':
      return 'bg-rose-500/10 border-rose-500/20';
    default:
      return 'bg-zinc-500/10 border-zinc-500/20';
  }
};
