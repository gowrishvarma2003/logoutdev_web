/**
 * KeyboardShortcutsModal Example
 * 
 * Shows how to integrate the keyboard shortcuts modal into your application
 */

"use client";

import { useState } from "react";
import KeyboardShortcutsModal from "@/components/ui/KeyboardShortcutsModal";
import { useShortcut } from "@/lib/hooks/useKeyboardShortcuts";

/**
 * Example 1: Basic usage in a layout or app component
 */
export function KeyboardShortcutsExample() {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Open shortcuts with ? key
  useShortcut(["?"], () => setIsShortcutsOpen(true));

  // Close with Escape
  useShortcut(["Esc"], () => setIsShortcutsOpen(false), isShortcutsOpen);

  return (
    <>
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Your other content */}
      <button
        onClick={() => setIsShortcutsOpen(true)}
        className="px-3 py-2 text-sm rounded border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
      >
        Show Shortcuts (?)
      </button>
    </>
  );
}

/**
 * Example 2: Using keyboard shortcuts for navigation
 */
export function NavigationWithShortcuts() {
  const [currentPage, setCurrentPage] = useState("home");

  // Register navigation shortcuts
  useShortcut(["g", "h"], () => setCurrentPage("home"));
  useShortcut(["g", "p"], () => setCurrentPage("profile"));
  useShortcut(["g", "s"], () => setCurrentPage("settings"));
  useShortcut(["g", "e"], () => setCurrentPage("explore"));

  return (
    <div>
      <nav>
        <button
          onClick={() => setCurrentPage("home")}
          className={currentPage === "home" ? "active" : ""}
        >
          Home (G H)
        </button>
        <button
          onClick={() => setCurrentPage("profile")}
          className={currentPage === "profile" ? "active" : ""}
        >
          Profile (G P)
        </button>
        <button
          onClick={() => setCurrentPage("settings")}
          className={currentPage === "settings" ? "active" : ""}
        >
          Settings (G S)
        </button>
        <button
          onClick={() => setCurrentPage("explore")}
          className={currentPage === "explore" ? "active" : ""}
        >
          Explore (G E)
        </button>
      </nav>
      <p>Current page: {currentPage}</p>
    </div>
  );
}

/**
 * Example 3: Using shortcuts for actions
 */
export function ActionsWithShortcuts() {
  const [showComposer, setShowComposer] = useState(false);

  // Register action shortcuts
  useShortcut(["c"], () => setShowComposer(true));
  useShortcut(["Esc"], () => setShowComposer(false), showComposer);

  return (
    <div>
      <button
        onClick={() => setShowComposer(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Compose (C)
      </button>

      {showComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2>New Post</h2>
            <input
              placeholder="What's on your mind?"
              autoFocus
              className="w-full border rounded p-2 mt-4"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowComposer(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowComposer(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Integration with root layout
 * 
 * Add this to your root layout (app.tsx or layout.tsx):
 * 
 * import { useState } from 'react';
 * import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';
 * import { useShortcut } from '@/lib/hooks/useKeyboardShortcuts';
 * 
 * export default function RootLayout() {
 *   const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
 * 
 *   // Open shortcuts with ? key
 *   useShortcut(["?"], () => setIsShortcutsOpen(true));
 * 
 *   return (
 *     <html>
 *       <body>
 *         <KeyboardShortcutsModal
 *           isOpen={isShortcutsOpen}
 *           onClose={() => setIsShortcutsOpen(false)}
 *         />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 */
