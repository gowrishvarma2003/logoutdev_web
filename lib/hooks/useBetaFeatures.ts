/**
 * useBetaFeatures - Hook for managing beta feature preferences
 * Stores enabled features in localStorage and provides toggle functionality
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'logoutdev_beta_features';

export interface BetaFeaturesState {
  [featureId: string]: boolean;
}

export const useBetaFeatures = () => {
  const [enabledFeatures, setEnabledFeatures] = useState<BetaFeaturesState>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEnabledFeatures(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load beta features from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle a feature
  const toggleFeature = useCallback(
    (featureId: string, enabled: boolean) => {
      setEnabledFeatures((prev) => {
        const updated = {
          ...prev,
          [featureId]: enabled,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to save beta features to localStorage:', error);
        }
        return updated;
      });
    },
    []
  );

  // Check if a feature is enabled
  const isFeatureEnabled = useCallback(
    (featureId: string): boolean => {
      return enabledFeatures[featureId] ?? false;
    },
    [enabledFeatures]
  );

  // Get all enabled feature IDs
  const getEnabledFeatures = useCallback((): string[] => {
    return Object.entries(enabledFeatures)
      .filter(([, enabled]) => enabled)
      .map(([featureId]) => featureId);
  }, [enabledFeatures]);

  // Reset all features
  const resetFeatures = useCallback(() => {
    setEnabledFeatures({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset beta features:', error);
    }
  }, []);

  return {
    enabledFeatures,
    isLoading,
    toggleFeature,
    isFeatureEnabled,
    getEnabledFeatures,
    resetFeatures,
  };
};
