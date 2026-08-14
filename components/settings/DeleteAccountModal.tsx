"use client";

/**
 * DeleteAccountModal - Multi-step account deletion confirmation
 * Step 1: Warning about what will be deleted
 * Step 2: Type "DELETE" to confirm
 * Step 3: Enter password for verification
 * Uses rose palette for danger styling
 */

import { useState, useRef, useEffect } from "react";
import Spinner from "@/components/ui/Spinner";
import { FocusManager } from "@/lib/utils/focusManagement";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckCircleIcon,
  TrashIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";

export interface DeleteAccountModalProps {
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

type Step = 1 | 2 | 3;

export default function DeleteAccountModal({
  onConfirm,
  onCancel,
}: DeleteAccountModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const focusManager = useRef(new FocusManager());
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Save focus when modal opens
    focusManager.current.saveFocus();
    
    // Focus close button initially (safest focus for destructive action)
    closeButtonRef.current?.focus();

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      // Restore focus when modal closes
      focusManager.current.restoreFocus();
    };
  }, [onCancel]);

  const canProceedStep2 = confirmText === "DELETE";
  const canProceedStep3 = password.length > 0;

  const handleNextStep = () => {
    setError("");
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedStep2) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setConfirmText("");
    setPassword("");
    setError("");
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleDelete = async () => {
    if (!canProceedStep3) return;

    setError("");
    setIsDeleting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call the delete handler
      await onConfirm();

      // If successful, the component will be unmounted
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete account"
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-zinc-900 rounded-2xl border border-rose-500/30 w-full max-w-md shadow-2xl overflow-hidden"
        role="alertdialog"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-rose-500/20 bg-rose-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <TrashIcon className="w-5 h-5 text-rose-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white" id="modal-title">Delete Account</h2>
              <p className="text-xs text-rose-300" aria-label={`Step ${currentStep} of 3`}>Step {currentStep} of 3</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onCancel}
            disabled={isDeleting}
            className="p-1 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            aria-label="Close dialog"
          >
            <XMarkIcon className="w-5 h-5 text-zinc-400" aria-hidden="true" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-zinc-800 flex gap-0.5 px-6 py-3" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={3} aria-label="Account deletion progress">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex-1 h-1 rounded-full transition-all ${
                step <= currentStep ? "bg-rose-500" : "bg-zinc-700"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Warning */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl" role="alert">
                <ExclamationTriangleIcon className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-white text-sm">
                    This action cannot be undone
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Deleting your account is permanent. Please read through the
                    consequences carefully.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  We will permanently delete:
                </h3>
                <ul className="space-y-2" id="modal-description">
                  <li className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="text-rose-400 mt-1" aria-hidden="true">•</span>
                    <span>Your account profile and all personal information</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="text-rose-400 mt-1" aria-hidden="true">•</span>
                    <span>All repositories and code</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="text-rose-400 mt-1" aria-hidden="true">•</span>
                    <span>All connected spaces and collaborations</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="text-rose-400 mt-1" aria-hidden="true">•</span>
                    <span>Your activity history and statistics</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="text-rose-400 mt-1" aria-hidden="true">•</span>
                    <span>Any active sessions and API tokens</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  💡 You have 30 days to reconsider. Contact support within this
                  period to recover your account.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Type DELETE */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Confirm deletion
                </h3>
                <p className="text-sm text-zinc-400">
                  Type <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-rose-300 font-mono">
                    DELETE
                  </code> to confirm you want to permanently delete your account.
                </p>
              </div>

              <div>
                <label htmlFor="confirm-text" className="block text-sm font-medium text-zinc-300 mb-2">
                  Confirmation
                </label>
                <input
                  id="confirm-text"
                  type="text"
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value.toUpperCase());
                    setError("");
                  }}
                  placeholder="Type DELETE"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center font-mono tracking-widest placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors uppercase"
                  autoFocus
                  aria-describedby="confirm-hint"
                />
                <p id="confirm-hint" className="text-xs text-zinc-500 mt-1 sr-only">
                  Type the word DELETE (all caps) to confirm
                </p>
              </div>

              {confirmText === "DELETE" && (
                <div className="flex items-center gap-2 text-sm text-emerald-400" role="status">
                  <CheckCircleIcon className="w-4 h-4" aria-hidden="true" />
                  <span>Confirmed</span>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Password Verification */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl" role="alert">
                <ShieldExclamationIcon className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-white text-sm">
                    Final verification required
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1">
                    Enter your password to verify this deletion request.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="password-input" className="block text-sm font-medium text-zinc-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors pr-10"
                    autoFocus
                    aria-describedby="password-hint"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 rounded p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p id="password-hint" className="text-xs text-zinc-500 mt-1 sr-only">
                  Enter your account password
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg" role="alert">
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              )}

              <p className="text-xs text-zinc-500">
                Demo hint: Any password works for testing
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-zinc-800 bg-zinc-950/50">
          <button
            onClick={currentStep === 1 ? onCancel : handlePrevStep}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNextStep}
              disabled={
                isDeleting ||
                (currentStep === 2 && !canProceedStep2)
              }
              className="flex-1 px-4 py-2.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-sm font-medium text-rose-300 hover:bg-rose-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleDelete}
              disabled={isDeleting || !canProceedStep3}
              className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 text-sm font-medium text-white hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              {isDeleting ? (
                <>
                  <Spinner size="sm" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <TrashIcon className="w-4 h-4" aria-hidden="true" />
                  <span>Delete Account</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
