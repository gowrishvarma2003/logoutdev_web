"use client";

/**
 * KeyboardShortcutsModal - Displays all available keyboard shortcuts
 * - Grouped by category (Navigation, Actions, General)
 * - Styled key badges similar to GitHub's shortcuts modal
 * - Opens with "?" key press
 * - Closes with Escape or click outside
 */

import { useEffect, useState } from "react";
import {
  XMarkIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  KEYBOARD_SHORTCUTS,
  KeyboardShortcutCategory,
  KeyboardShortcut,
} from "@/lib/constants/keyboardShortcuts";
import { useShortcut } from "@/lib/hooks/useKeyboardShortcuts";

export interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Key badge component for displaying individual keys
 */
function KeyBadge({ label }: { label: string }) {
  const isModifier =
    label === "Cmd" ||
    label === "Ctrl" ||
    label === "Alt" ||
    label === "Shift" ||
    label === "Meta";

  return (
    <span
      className={`
        inline-flex items-center justify-center
        px-2 py-1 
        text-xs font-semibold
        rounded border
        font-mono
        ${
          isModifier
            ? "bg-zinc-800 border-zinc-600 text-zinc-300"
            : label === "Space"
              ? "bg-zinc-800 border-zinc-600 text-zinc-300 min-w-12"
              : "bg-zinc-800 border-zinc-600 text-zinc-300"
        }
      `}
    >
      {label}
    </span>
  );
}

/**
 * Shortcut item component
 */
function ShortcutItem({ shortcut }: { shortcut: KeyboardShortcut }) {
  return (
    <div className="flex items-center justify-between py-3 px-3 hover:bg-zinc-800/50 rounded-lg transition-colors group">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm text-zinc-300 group-hover:text-white transition-colors flex-shrink-0 min-w-max">
          {shortcut.description}
        </span>
      </div>

      <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
        {shortcut.keys.map((key, index) => (
          <div key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <span className="text-zinc-500 text-xs font-semibold">+</span>
            )}
            <KeyBadge label={key} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Shortcut category section
 */
function ShortcutCategory({
  title,
  shortcuts,
}: {
  title: string;
  shortcuts: KeyboardShortcut[];
}) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-3 py-2 mb-2">
        {title}
      </h3>
      <div className="space-y-1">
        {shortcuts.map((shortcut, index) => (
          <ShortcutItem key={index} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
}

export default function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  const [mounted, setMounted] = useState(false);

  // Register the ? shortcut to open the modal
  useShortcut(["?"], onClose === (() => {}) ? () => {} : onClose, isOpen);

  // Close with Escape
  useShortcut(
    ["Esc"],
    onClose,
    isOpen
  );

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setMounted(true);
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Sort categories for consistent display
  const categoryOrder = ["navigation", "actions", "general"];
  const sortedCategories = categoryOrder.reduce((acc, key) => {
    if (key in KEYBOARD_SHORTCUTS) {
      acc[key] = KEYBOARD_SHORTCUTS[key as keyof KeyboardShortcutCategory];
    }
    return acc;
  }, {} as KeyboardShortcutCategory);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700/50 w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700/30 bg-gradient-to-r from-zinc-900 to-zinc-800/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Keyboard Shortcuts
              </h2>
              <p className="text-xs text-zinc-400">
                Press <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono text-xs">?</kbd> anytime to show this
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white"
            aria-label="Close shortcuts modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-2">
          {Object.entries(sortedCategories).map(([categoryKey, shortcuts]) => (
            <ShortcutCategory
              key={categoryKey}
              title={categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)}
              shortcuts={shortcuts}
            />
          ))}

          {/* Help text */}
          <div className="mt-8 pt-6 border-t border-zinc-700/30">
            <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <svg
                className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-xs text-blue-300">
                  <strong>Tip:</strong> Two-key sequences (like{" "}
                  <kbd className="bg-blue-500/10 px-1.5 py-0.5 rounded text-blue-300 font-mono text-xs border border-blue-500/30">G</kbd>
                  {" "}then{" "}
                  <kbd className="bg-blue-500/10 px-1.5 py-0.5 rounded text-blue-300 font-mono text-xs border border-blue-500/30">H</kbd>) work even while holding
                  keys. Single keys like{" "}
                  <kbd className="bg-blue-500/10 px-1.5 py-0.5 rounded text-blue-300 font-mono text-xs border border-blue-500/30">/</kbd>
                  {" "}work outside of text fields.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700/30 bg-zinc-950/50 flex-shrink-0">
          <p className="text-xs text-zinc-500 flex items-center gap-2">
            <ChevronRightIcon className="w-4 h-4" />
            Press{" "}
            <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 font-mono text-xs border border-zinc-600">
              ESC
            </kbd>{" "}
            to close
          </p>
        </div>
      </div>
    </div>
  );
}
