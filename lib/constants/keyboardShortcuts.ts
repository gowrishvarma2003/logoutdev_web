/**
 * Keyboard shortcuts configuration for LogoutDev
 * Organized by category for display in the shortcuts modal
 */

export interface KeyboardShortcut {
  keys: string[];
  description: string;
}

export interface KeyboardShortcutCategory {
  [key: string]: KeyboardShortcut[];
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcutCategory = {
  navigation: [
    { keys: ["g", "h"], description: "Go to home" },
    { keys: ["g", "p"], description: "Go to profile" },
    { keys: ["g", "s"], description: "Go to settings" },
    { keys: ["g", "e"], description: "Go to explore" },
  ],
  actions: [
    { keys: ["n", "p"], description: "New post" },
    { keys: ["n", "r"], description: "New project" },
    { keys: ["/"], description: "Focus search" },
    { keys: ["c"], description: "Compose" },
  ],
  general: [
    { keys: ["?"], description: "Show shortcuts" },
    { keys: ["Esc"], description: "Close modal / Cancel action" },
    { keys: ["Enter"], description: "Confirm action" },
  ],
};

/**
 * Get all shortcuts flattened for easy lookup
 */
export function getAllShortcuts(): KeyboardShortcut[] {
  return Object.values(KEYBOARD_SHORTCUTS).flat();
}

/**
 * Find a shortcut by key combination
 */
export function findShortcutByKeys(keys: string[]): KeyboardShortcut | undefined {
  return getAllShortcuts().find((shortcut) =>
    JSON.stringify(shortcut.keys.sort()) === JSON.stringify(keys.sort())
  );
}
