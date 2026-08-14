"use client";

/**
 * DangerAction - Individual dangerous action item component
 * Displays a single dangerous action with title, description, and action button
 * Features:
 * - Optional confirmation modal
 * - Red themed action button
 * - Loading states
 * - Customizable confirmation text
 */

import { useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export interface DangerActionProps {
  /** Title of the dangerous action */
  title: string;
  /** Description of what will happen */
  description: string;
  /** Text to display on the action button */
  buttonText: string;
  /** Callback when action is confirmed */
  onAction: () => Promise<void> | void;
  /** Whether to show a confirmation modal before executing action */
  requireConfirmation?: boolean;
  /** Custom confirmation prompt text */
  confirmTitle?: string;
  /** Custom confirmation description */
  confirmDescription?: string;
  /** Custom confirmation button text */
  confirmButtonText?: string;
  /** Disable the action button */
  disabled?: boolean;
}

export default function DangerAction({
  title,
  description,
  buttonText,
  onAction,
  requireConfirmation = true,
  confirmTitle = "Confirm Action",
  confirmDescription = "Are you sure you want to proceed? This action cannot be undone.",
  confirmButtonText = "Confirm",
  disabled = false,
}: DangerActionProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    if (requireConfirmation) {
      setShowConfirm(true);
    } else {
      await executeAction();
    }
  };

  const executeAction = async () => {
    setError("");
    setIsLoading(true);

    try {
      await onAction();
      setShowConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Action Item */}
      <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-lg hover:bg-rose-500/10 transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white">{title}</h4>
            <p className="text-xs text-zinc-400 mt-1">{description}</p>
          </div>
          <button
            onClick={handleClick}
            disabled={disabled || isLoading}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{buttonText}</span>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-2 bg-rose-500/20 border border-rose-500/40 rounded text-xs text-rose-300">
            {error}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl border border-rose-500/30 w-full max-w-sm shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-rose-500/20 bg-rose-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <ExclamationTriangleIcon className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{confirmTitle}</h3>
              </div>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="p-1 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-zinc-300">{confirmDescription}</p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-zinc-800 bg-zinc-950/50">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/50 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{confirmButtonText}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
