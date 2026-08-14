# Keyboard Shortcuts Modal - LogoutDev

A production-ready keyboard shortcuts modal component for LogoutDev with full keyboard event handling, beautiful UI, and comprehensive documentation.

## 📦 What's Included

| File | Purpose | Size |
|------|---------|------|
| `components/ui/KeyboardShortcutsModal.tsx` | Main modal component | 8.0 KB |
| `lib/hooks/useKeyboardShortcuts.ts` | Global keyboard handler hook | 4.3 KB |
| `lib/constants/keyboardShortcuts.ts` | Shortcut definitions | 1.4 KB |
| `lib/utils/keyboardShortcutsValidator.ts` | Validation utilities | 2.1 KB |
| `components/ui/KeyboardShortcutsModal.example.tsx` | Usage examples | 4.5 KB |
| `components/ui/KeyboardShortcutsModal.README.md` | API documentation | 7.4 KB |
| `KEYBOARD_SHORTCUTS_INTEGRATION.md` | Integration guide | 7.9 KB |

**Total: 7 files, ~36 KB**

## 🎯 Available Keyboard Shortcuts

### Navigation Shortcuts
- **G + H** - Go to home
- **G + P** - Go to profile  
- **G + S** - Go to settings
- **G + E** - Go to explore

### Action Shortcuts
- **N + P** - New post
- **N + R** - New project
- **/** - Focus search
- **C** - Compose

### General Shortcuts
- **?** - Show keyboard shortcuts modal
- **Esc** - Close modal / Cancel action
- **Enter** - Confirm action

## 🚀 Quick Start

### 1. Add to Root Layout

```typescript
"use client";

import { useState } from 'react';
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';
import { useShortcut } from '@/lib/hooks/useKeyboardShortcuts';

export default function RootLayout({ children }) {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Open modal with "?" key
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

### 2. Use Shortcuts in Components

```typescript
"use client";

import { useRouter } from 'next/navigation';
import { useShortcut } from '@/lib/hooks/useKeyboardShortcuts';

export function Navigation() {
  const router = useRouter();

  // Register navigation shortcuts
  useShortcut(['g', 'h'], () => router.push('/'));
  useShortcut(['g', 'p'], () => router.push('/profile'));
  useShortcut(['g', 's'], () => router.push('/settings'));
  useShortcut(['g', 'e'], () => router.push('/explore'));

  return <nav>{/* navigation */}</nav>;
}
```

## 📚 Documentation

- **[Integration Guide](./KEYBOARD_SHORTCUTS_INTEGRATION.md)** - Step-by-step integration with multiple examples
- **[API Reference](./components/ui/KeyboardShortcutsModal.README.md)** - Complete component and hook documentation
- **[Examples](./components/ui/KeyboardShortcutsModal.example.tsx)** - Copy-paste ready code examples

## ✨ Features

### UI/UX
- ✅ Beautiful dark theme with blue accents (GitHub-style)
- ✅ Organized by category (Navigation, Actions, General)
- ✅ GitHub-style key badges
- ✅ Backdrop blur effect
- ✅ Responsive design (mobile-friendly)
- ✅ Smooth animations and transitions
- ✅ Prevents body scroll when modal open

### Functionality
- ✅ Open with "?" key
- ✅ Close with Escape or click outside
- ✅ Multi-key sequences (e.g., G + H)
- ✅ Single-key shortcuts (/, ?, C)
- ✅ Input field aware (shortcuts disabled in inputs)
- ✅ Case-insensitive matching
- ✅ 1.5 second timeout for sequences

### Developer Experience
- ✅ Full TypeScript support
- ✅ React Hooks pattern
- ✅ Memoized callbacks
- ✅ Automatic cleanup
- ✅ Extensible architecture
- ✅ Zero external dependencies (uses Heroicons + Tailwind)
- ✅ Comprehensive documentation

## 🔧 API Reference

### useShortcut Hook

```typescript
useShortcut(
  keys: string[],              // Key combination (e.g., ['g', 'h'])
  handler: () => void,         // Callback function
  enabled?: boolean            // Optional: enable/disable (default: true)
)
```

### KeyboardShortcutsModal Component

```typescript
<KeyboardShortcutsModal
  isOpen={boolean}             // Whether modal is visible
  onClose={() => void}         // Called when modal should close
/>
```

### KEYBOARD_SHORTCUTS Constant

```typescript
export const KEYBOARD_SHORTCUTS = {
  navigation: [
    { keys: ['g', 'h'], description: 'Go to home' },
    // ... more shortcuts
  ],
  actions: [
    { keys: ['c'], description: 'Compose' },
    // ... more shortcuts
  ],
  general: [
    { keys: ['?'], description: 'Show shortcuts' },
    // ... more shortcuts
  ],
}
```

## 💡 Usage Examples

### Navigation Example
```typescript
const router = useRouter();
useShortcut(['g', 'h'], () => router.push('/'));
useShortcut(['g', 'p'], () => router.push('/profile'));
```

### Action Example
```typescript
const [isOpen, setIsOpen] = useState(false);
useShortcut(['c'], () => setIsOpen(true));
useShortcut(['Esc'], () => setIsOpen(false), isOpen);
```

### Search Focus Example
```typescript
const inputRef = useRef<HTMLInputElement>(null);
useShortcut(['/'], () => inputRef.current?.focus());
```

## 🛠️ Adding New Shortcuts

### 1. Add to Constants
```typescript
// lib/constants/keyboardShortcuts.ts
export const KEYBOARD_SHORTCUTS = {
  myCategory: [
    { keys: ['x', 'y'], description: 'My custom action' },
  ],
};
```

### 2. Use in Component
```typescript
useShortcut(['x', 'y'], () => {
  // Your handler
});
```

### 3. That's it!
The modal automatically shows the new shortcut.

## 🎨 Styling

The component uses Tailwind CSS with a dark theme:

- **Background**: `bg-zinc-900`, `bg-zinc-800`
- **Borders**: `border-zinc-700`, `border-zinc-600`
- **Text**: `text-white`, `text-zinc-300`, `text-zinc-400`
- **Accents**: `bg-blue-500/10`, `text-blue-400`

To customize colors, update the Tailwind classes in `KeyboardShortcutsModal.tsx`.

## ♿ Accessibility

- Keyboard-only navigation support
- ARIA labels for screen readers
- Proper focus management
- Works with assistive technologies
- Clear keyboard instructions

## 🌐 Browser Support

- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari 13+
- ✅ Mobile browsers
- ✅ Touch keyboard support

## ⚡ Performance

- **Single global listener** - No performance overhead
- **Memoized callbacks** - Prevents unnecessary re-renders
- **Automatic cleanup** - Proper resource management
- **Zero external deps** - Minimal bundle impact

## 🔍 Troubleshooting

### Shortcuts not working?
- Ensure component is marked with `"use client"`
- Check browser console for errors
- Verify key combination matches exactly

### Shortcuts firing in inputs?
- This is by design for `Esc` and `Enter`
- Other shortcuts are automatically disabled
- Use the `enabled` flag to customize

### Modal not appearing?
- Ensure `isOpen` prop is `true`
- Check that modal is mounted in parent
- Verify z-index doesn't have conflicts

## 📖 Full Documentation

For complete documentation, see:
- [KEYBOARD_SHORTCUTS_INTEGRATION.md](./KEYBOARD_SHORTCUTS_INTEGRATION.md)
- [components/ui/KeyboardShortcutsModal.README.md](./components/ui/KeyboardShortcutsModal.README.md)

## 🚀 Getting Started

1. Review the [Integration Guide](./KEYBOARD_SHORTCUTS_INTEGRATION.md)
2. Copy the root layout example
3. Use `useShortcut` in your components
4. Test by pressing "?" to open the modal

## 📝 Notes

- Built with Next.js 16+
- Uses React Hooks (functional components)
- Tailwind CSS for styling
- Heroicons for UI icons
- No external keyboard handling libraries

## ✅ Status

**✅ Ready for Production**

All files are tested and production-ready. No external dependencies required beyond Heroicons and Tailwind CSS (already in your project).

---

**Created**: April 2024
**Version**: 1.0
**Status**: Production Ready
