# Keyboard Shortcuts Modal

A comprehensive keyboard shortcuts modal component for LogoutDev that displays all available keyboard shortcuts organized by category. Similar to GitHub's shortcuts modal UI.

## Features

✨ **Core Features**
- Beautiful modal UI with category-based organization
- Styled key badges (similar to GitHub)
- Opens with `?` key press
- Closes with `Escape` key or click outside
- Global keyboard shortcut handling
- Supports both single-key and multi-key sequences

## Files

### 1. `components/ui/KeyboardShortcutsModal.tsx`
Main modal component displaying shortcuts in a categorized list.

**Props:**
```typescript
interface KeyboardShortcutsModalProps {
  isOpen: boolean;        // Whether modal is visible
  onClose: () => void;    // Callback when modal should close
}
```

**Features:**
- Prevents body scroll when open
- Click outside to close
- Escape key to close
- Keyboard navigation hints
- Responsive design

### 2. `lib/constants/keyboardShortcuts.ts`
Centralized keyboard shortcuts configuration.

**Shortcuts by Category:**

**Navigation:**
- `g h` - Go to home
- `g p` - Go to profile
- `g s` - Go to settings
- `g e` - Go to explore

**Actions:**
- `n p` - New post
- `n r` - New project
- `/` - Focus search
- `c` - Compose

**General:**
- `?` - Show shortcuts
- `Esc` - Close modal / Cancel action
- `Enter` - Confirm action

### 3. `lib/hooks/useKeyboardShortcuts.ts`
Global keyboard shortcut handling hook.

**Exports:**

#### `useKeyboardShortcuts()`
Main hook for keyboard shortcut management.

```typescript
const { registerShortcut } = useKeyboardShortcuts();

// Register a shortcut
registerShortcut(['g', 'h'], () => {
  navigate('/');
});
```

#### `useShortcut(keys, handler, enabled)`
Simplified hook to register a single shortcut.

```typescript
useShortcut(
  ['?'],                              // Key combination
  () => setIsOpen(true),              // Handler callback
  true                                // Enabled flag (optional)
);
```

**Features:**
- Automatic cleanup on unmount
- Handles single and multi-key sequences
- Ignores shortcuts when typing in inputs (except for specific keys)
- Case-insensitive key matching
- 1.5 second timeout for key sequences

## Usage

### Basic Setup in Root Layout

```typescript
// app.tsx or root layout
"use client";

import { useState } from 'react';
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';
import { useShortcut } from '@/lib/hooks/useKeyboardShortcuts';

export default function RootLayout({ children }) {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Open with ?
  useShortcut(["?"], () => setIsShortcutsOpen(true));

  return (
    <html>
      <body>
        <KeyboardShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
        {children}
      </body>
    </html>
  );
}
```

### Using Shortcuts for Navigation

```typescript
"use client";

import { useRouter } from 'next/navigation';
import { useShortcut } from '@/lib/hooks/useKeyboardShortcuts';

export default function Navigation() {
  const router = useRouter();

  // Navigation shortcuts
  useShortcut(['g', 'h'], () => router.push('/'));
  useShortcut(['g', 'p'], () => router.push('/profile'));
  useShortcut(['g', 's'], () => router.push('/settings'));
  useShortcut(['g', 'e'], () => router.push('/explore'));

  return (
    <nav>
      {/* Navigation items */}
    </nav>
  );
}
```

### Using Shortcuts for Actions

```typescript
"use client";

import { useState } from 'react';
import { useShortcut } from '@/lib/hooks/useKeyboardShortcuts';

export default function Composer() {
  const [isOpen, setIsOpen] = useState(false);

  // Open composer with 'c'
  useShortcut(['c'], () => setIsOpen(true));
  
  // Close with Escape
  useShortcut(['Esc'], () => setIsOpen(false), isOpen);

  return (
    <>
      {isOpen && (
        <ComposerModal onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
```

## Keyboard Event Handling

### Supported Key Types

- **Single keys**: `/`, `?`, `c`, etc.
- **Multi-key sequences**: `g h`, `n p`, etc. (press keys within 1.5 seconds)
- **Special keys**: `Esc`, `Enter`
- **Case insensitive**: Works with any case

### Input Field Behavior

Shortcuts are automatically disabled when typing in:
- `<input>` elements
- `<textarea>` elements
- `contenteditable` elements

**Exception:** The following shortcuts work even in input fields:
- `Esc` - Close modals/cancel
- `Enter` - Confirm actions

## Key Badge Styling

The modal uses styled key badges similar to GitHub's design:

```typescript
// Gray badges for regular keys
<KeyBadge label="G" />      // Displays as "G"
<KeyBadge label="H" />      // Displays as "H"

// Special handling for common keys
<KeyBadge label="Space" />  // Wider badge
<KeyBadge label="Esc" />    // Escape key
```

## Adding New Shortcuts

### Step 1: Add to Constants
```typescript
// lib/constants/keyboardShortcuts.ts
export const KEYBOARD_SHORTCUTS: KeyboardShortcutCategory = {
  newCategory: [
    { keys: ['x', 'y'], description: 'Your action description' },
  ],
};
```

### Step 2: Register in Component
```typescript
// In your component
useShortcut(['x', 'y'], () => {
  // Your handler
});
```

### Step 3: Use the Modal
The modal automatically picks up new shortcuts from `KEYBOARD_SHORTCUTS`!

## Styling Customization

The component uses Tailwind CSS with a dark theme (zinc-900, zinc-800, etc.).

**Key classes used:**
- Background: `bg-zinc-900`, `bg-zinc-800`
- Borders: `border-zinc-700`, `border-zinc-600`
- Text: `text-white`, `text-zinc-300`, `text-zinc-400`
- Accents: `text-blue-400`, `bg-blue-500/10`

To customize colors, update the Tailwind classes in the component.

## Accessibility

- **Keyboard navigation**: All shortcuts work via keyboard
- **ARIA labels**: Proper labels for screen readers
- **Focus management**: Modal closes on Escape
- **Backdrop click**: Can click outside to close
- **Hint text**: Displays keyboard hints in footer

## Performance Considerations

- **Memoization**: Key normalization and handler registration are memoized
- **Event delegation**: Single global listener instead of per-component
- **Cleanup**: Automatic removal of listeners and timeouts on unmount
- **Debouncing**: 1.5 second timeout prevents accidental multi-key sequences

## Browser Support

- Modern browsers with:
  - ES6+ support
  - `KeyboardEvent` support
  - `setTimeout` support

## Examples

See `KeyboardShortcutsModal.example.tsx` for comprehensive usage examples including:
- Basic modal integration
- Navigation with shortcuts
- Action-based shortcuts
- Root layout integration

## Troubleshooting

### Shortcuts Not Working

1. Ensure `useShortcut` is called in a client component (`"use client"`)
2. Check that the key combination matches exactly
3. Verify shortcuts aren't disabled by the `enabled` flag
4. Check browser console for JavaScript errors

### Shortcuts Firing in Input Fields

1. This is by design for `Esc` and `Enter`
2. Other shortcuts are automatically disabled in inputs
3. If you need a different behavior, update the check in `handleKeyDown`

### Modal Not Appearing

1. Ensure `isOpen` prop is `true`
2. Check that the modal component is mounted in parent
3. Verify no other modals have higher z-index (modal uses `z-50`)

## Notes

- The component uses `"use client"` directive (Next.js client component)
- Requires React hooks support
- Tailwind CSS for styling
- Heroicons for icons

---

**Last Updated:** April 2024
