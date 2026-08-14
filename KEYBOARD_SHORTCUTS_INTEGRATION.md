/**
 * KEYBOARD SHORTCUTS MODAL - INTEGRATION GUIDE
 * 
 * Quick reference for implementing keyboard shortcuts in LogoutDev
 */

// ============================================================================
// 1. ROOT LAYOUT INTEGRATION (app.tsx or layout.tsx)
// ============================================================================

"use client";

import { useState } from "react";
import KeyboardShortcutsModal from "@/components/ui/KeyboardShortcutsModal";
import { useShortcut } from "@/lib/hooks/useKeyboardShortcuts";

export default function RootLayout({ children }) {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Open shortcuts modal with "?"
  useShortcut(["?"], () => setIsShortcutsOpen(true));

  return (
    <html>
      <body>
        {/* Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />

        {/* Rest of your app */}
        {children}
      </body>
    </html>
  );
}

// ============================================================================
// 2. NAVIGATION COMPONENT INTEGRATION
// ============================================================================

"use client";

import { useRouter } from "next/navigation";
import { useShortcut } from "@/lib/hooks/useKeyboardShortcuts";

export function MainNav() {
  const router = useRouter();

  // Navigation shortcuts
  useShortcut(["g", "h"], () => router.push("/"));
  useShortcut(["g", "p"], () => router.push("/profile"));
  useShortcut(["g", "s"], () => router.push("/settings"));
  useShortcut(["g", "e"], () => router.push("/explore"));

  return (
    <nav>
      <a href="/">Home (G H)</a>
      <a href="/profile">Profile (G P)</a>
      <a href="/settings">Settings (G S)</a>
      <a href="/explore">Explore (G E)</a>
    </nav>
  );
}

// ============================================================================
// 3. ACTION COMPONENT INTEGRATION (Composer)
// ============================================================================

"use client";

import { useState } from "react";
import { useShortcut } from "@/lib/hooks/useKeyboardShortcuts";

export function Composer() {
  const [isOpen, setIsOpen] = useState(false);

  // Open composer with 'C'
  useShortcut(["c"], () => setIsOpen(true));

  // Close with Escape (automatically managed)
  useShortcut(["Esc"], () => setIsOpen(false), isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2>New Post</h2>
        <textarea
          placeholder="What's on your mind?"
          className="w-full border rounded p-2 mt-4 mb-4"
          rows={4}
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel (Esc)
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Post (Enter)
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. SEARCH SHORTCUT INTEGRATION
// ============================================================================

"use client";

import { useState, useRef } from "react";
import { useShortcut } from "@/lib/hooks/useKeyboardShortcuts";

export function SearchBar() {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search with "/"
  useShortcut(["/"], () => {
    inputRef.current?.focus();
    setIsFocused(true);
  });

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search (/) ..."
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className="w-full border rounded px-3 py-2"
    />
  );
}

// ============================================================================
// 5. ADDING NEW SHORTCUTS
// ============================================================================

// Step 1: Add to lib/constants/keyboardShortcuts.ts
export const KEYBOARD_SHORTCUTS = {
  myCustomCategory: [
    {
      keys: ["x", "y"],
      description: "My custom action",
    },
  ],
};

// Step 2: Use in your component
export function MyComponent() {
  useShortcut(["x", "y"], () => {
    console.log("Custom action triggered!");
  });

  return <div>Component that responds to X Y shortcut</div>;
}

// Step 3: The modal will automatically show the new shortcut!

// ============================================================================
// 6. CONDITIONAL SHORTCUTS
// ============================================================================

"use client";

import { useShortcut } from "@/lib/hooks/useKeyboardShortcuts";
import { usePathname } from "next/navigation";

export function ConditionalShortcuts() {
  const pathname = usePathname();
  const isProfile = pathname === "/profile";

  // Only enable this shortcut when on profile page
  useShortcut(
    ["e"],
    () => console.log("Edit profile"),
    isProfile // enabled flag
  );

  return <div>Component with conditional shortcuts</div>;
}

// ============================================================================
// 7. SHORTCUT REFERENCE
// ============================================================================

/*
AVAILABLE SHORTCUTS BY DEFAULT:

Navigation:
  G H → Go to home
  G P → Go to profile
  G S → Go to settings
  G E → Go to explore

Actions:
  N P → New post
  N R → New project
  / → Focus search
  C → Compose

General:
  ? → Show shortcuts
  ESC → Close modal / Cancel action
  ENTER → Confirm action

HOW TO USE:
  - Single keys work outside text fields: /, ?, c
  - Multi-key sequences: Press both keys within 1.5 seconds (e.g., G then H)
  - ESC and ENTER work even in text fields
  - Case insensitive: 'g' and 'G' work the same
*/

// ============================================================================
// 8. MIGRATION CHECKLIST
// ============================================================================

/*
To add keyboard shortcuts to an existing component:

□ Import useShortcut from @/lib/hooks/useKeyboardShortcuts
□ Add useShortcut hook calls for your keyboard shortcuts
□ Mark component as "use client" if not already
□ Add visual hints in UI (optional): "(G H)" after button labels
□ Test shortcuts work in different states (modal open, typing, etc)
□ Update keyboard shortcuts constants if adding new shortcuts
□ Run yarn build to check for TypeScript errors
□ Test on different browsers (Chrome, Firefox, Safari)
*/

// ============================================================================
// 9. TROUBLESHOOTING
// ============================================================================

/*
Q: Shortcuts not working?
A: 
  - Ensure component is marked with "use client"
  - Check browser console for errors
  - Verify key combination matches exactly (case insensitive but must be exact)
  - Make sure useShortcut is called in render, not inside conditionals

Q: Shortcuts firing when typing?
A: 
  - Single-key shortcuts are designed to be disabled in inputs (except /, ?)
  - ESC and ENTER always work in inputs
  - Use the 'enabled' flag to disable shortcuts conditionally

Q: Multiple modals/shortcuts interfering?
A: 
  - Modals use proper z-index (z-50)
  - Use the 'enabled' flag to disable shortcuts when modal is open
  - useShortcut(["x"], handler, isModalOpen) to enable only when needed

Q: Performance issues?
A: 
  - All event listeners are memoized and cleaned up
  - No performance concerns for normal usage
  - If registering 100+ shortcuts, consider optimization
*/

// ============================================================================
