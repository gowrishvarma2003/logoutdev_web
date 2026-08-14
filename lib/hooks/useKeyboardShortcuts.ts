/**
 * useKeyboardShortcuts Hook
 * Manages global keyboard shortcut handling
 * Provides utilities for registering and triggering shortcuts
 */

import { useEffect, useCallback, useRef } from "react";

export interface KeyboardShortcutHandler {
  keys: string[];
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts() {
  const shortcutsRef = useRef<Map<string, () => void>>(new Map());
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const sequenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Register a keyboard shortcut
   */
  const registerShortcut = useCallback(
    (keys: string[], handler: () => void) => {
      const keyString = keys.join("+").toLowerCase();
      shortcutsRef.current.set(keyString, handler);

      return () => {
        shortcutsRef.current.delete(keyString);
      };
    },
    []
  );

  /**
   * Normalize key name for consistency
   */
  const normalizeKey = (key: string): string => {
    const keyMap: { [key: string]: string } = {
      " ": "Space",
      "?": "?",
      "/": "/",
      Enter: "Enter",
      Escape: "Esc",
      ArrowUp: "ArrowUp",
      ArrowDown: "ArrowDown",
      ArrowLeft: "ArrowLeft",
      ArrowRight: "ArrowRight",
    };

    return keyMap[key] || key.toLowerCase();
  };

  /**
   * Handle key down events
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in input or textarea (except for specific shortcuts)
      const target = event.target as HTMLElement;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.contentEditable === "true";

      const normalizedKey = normalizeKey(event.key);

      // Check for single key shortcuts (like ? and /)
      if ((normalizedKey === "?" || normalizedKey === "/") && !isInput) {
        const handler = shortcutsRef.current.get(normalizedKey);
        if (handler) {
          event.preventDefault();
          handler();
          return;
        }
      }

      // Check for Escape
      if (normalizedKey === "Esc") {
        const handler = shortcutsRef.current.get("esc");
        if (handler) {
          event.preventDefault();
          handler();
          return;
        }
      }

      // For input fields, only allow specific shortcuts
      if (isInput && normalizedKey !== "Esc" && normalizedKey !== "Enter") {
        return;
      }

      // Handle multi-key sequences (like 'g' + 'h')
      pressedKeysRef.current.add(normalizedKey);

      // Check for two-key sequences
      if (pressedKeysRef.current.size === 2) {
        const keysArray = Array.from(pressedKeysRef.current).sort();
        const keySequence = keysArray.join("+").toLowerCase();

        const handler = shortcutsRef.current.get(keySequence);
        if (handler) {
          event.preventDefault();
          handler();
          pressedKeysRef.current.clear();
          return;
        }
      }

      // Clear the set after a short timeout if no matching shortcut
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }

      sequenceTimeoutRef.current = setTimeout(() => {
        pressedKeysRef.current.clear();
      }, 1500);
    },
    []
  );

  /**
   * Handle key up events
   */
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const normalizedKey = normalizeKey(event.key);
    pressedKeysRef.current.delete(normalizedKey);
  }, []);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    registerShortcut,
  };
}

/**
 * Hook to register a specific keyboard shortcut
 */
export function useShortcut(
  keys: string[],
  handler: () => void,
  enabled = true
) {
  const { registerShortcut } = useKeyboardShortcuts();

  useEffect(() => {
    if (!enabled) return;

    return registerShortcut(keys, handler);
  }, [keys, handler, enabled, registerShortcut]);
}
