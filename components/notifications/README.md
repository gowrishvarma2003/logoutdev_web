# Badge Earned Notifications

Celebratory toast notifications that display when users earn badges in LogoutDev.

## Features

- ✨ Celebratory sparkle animations (CSS-based)
- 🎯 Floating badge emoji with pulse animation
- ⏱️ Auto-dismiss after 5 seconds with progress bar
- 🎨 Beautiful gradient design with purple theme
- 📱 Responsive and mobile-friendly
- ♿ Accessible with ARIA labels and semantic HTML
- 🚀 Queue support for multiple badges
- ❌ Manual close button

## Components

### `BadgeEarnedToast`
Individual toast notification component that displays a single badge earned event.

**Props:**
- `badge: BadgeData` - Badge information to display
  - `id?: string` - Optional badge ID
  - `name: string` - Badge name (e.g., "First Launch")
  - `emoji: string` - Badge emoji (e.g., "🚀")
  - `description: string` - Badge description
- `onClose: () => void` - Callback when toast is closed
- `autoCloseDuration?: number` - Auto-close delay in ms (default: 5000)

### `BadgeNotificationContainer`
Container component that manages multiple badge notifications in a stack.

**Props:**
- `badges: QueuedBadge[]` - Array of badges to display
- `onRemove: (toastId: string) => void` - Callback when a toast is removed

## Hook

### `useBadgeNotifications`

React hook for managing badge notifications throughout your app.

**Returns:**
- `badges: QueuedBadge[]` - Current badges in queue
- `showBadgeEarned(badge: BadgeData)` - Function to show a badge notification
- `removeBadge(toastId: string)` - Function to manually remove a badge

## Setup

### 1. Add to Root Layout

In your root layout component (e.g., `app/layout.tsx`), add the container:

```tsx
import { useBadgeNotifications } from "@/lib/hooks/useBadgeNotifications";
import { BadgeNotificationContainer } from "@/components/notifications";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { badges, removeBadge } = useBadgeNotifications();

  return (
    <html lang="en">
      <body>
        {children}
        <BadgeNotificationContainer badges={badges} onRemove={removeBadge} />
      </body>
    </html>
  );
}
```

### 2. Use in Components

```tsx
import { useBadgeNotifications } from "@/lib/hooks/useBadgeNotifications";

export function MyComponent() {
  const { showBadgeEarned } = useBadgeNotifications();

  const handleBadgeEarned = () => {
    showBadgeEarned({
      name: "First Launch",
      emoji: "🚀",
      description: "Launched your first project!",
    });
  };

  return <button onClick={handleBadgeEarned}>Earn Badge</button>;
}
```

## Example Badges

```tsx
// Achievement unlocked
showBadgeEarned({
  name: "Achievement Unlocked",
  emoji: "🏆",
  description: "Completed your first milestone!",
});

// Skill milestone
showBadgeEarned({
  name: "Expert Developer",
  emoji: "💻",
  description: "Reached expert level in 3 skills!",
});

// Social achievement
showBadgeEarned({
  name: "Team Player",
  emoji: "🤝",
  description: "Collaborated with 10 developers!",
});

// Streak achievement
showBadgeEarned({
  name: "7-Day Streak",
  emoji: "🔥",
  description: "Logged in every day this week!",
});

// Special badge
showBadgeEarned({
  name: "Early Adopter",
  emoji: "⭐",
  description: "You were one of the first to join!",
});
```

## Customization

### Animation Duration
Change the auto-close duration:

```tsx
<BadgeEarnedToast
  badge={badge}
  onClose={onClose}
  autoCloseDuration={7000}  // 7 seconds instead of 5
/>
```

### Styling
The component uses Tailwind CSS classes. To customize colors, modify the `BadgeEarnedToast.tsx`:

- Gradient: Change `from-purple-900 to-indigo-900` to different colors
- Border: Modify `border-purple-500/30`
- Button: Change `bg-purple-600 hover:bg-purple-500`
- Text: Adjust `text-purple-100`, `text-purple-200`, etc.

### Animation Customization
CSS animations are defined in inline `<style>` tags:

- `slideIn/slideOut` - Toast entrance/exit
- `sparkle` - Sparkle effect
- `float` - Badge emoji floating animation
- `pulse` - Badge emoji pulse animation

To modify animation timing, edit the animation definitions in the component.

## Accessibility

The component includes:
- `role="status"` and `aria-live="polite"` for screen readers
- Semantic button elements
- Clear visual hierarchy
- Keyboard-accessible close button

## Performance

- Animations use CSS transforms and opacity (GPU accelerated)
- No external animation libraries
- Efficient React state management with useCallback
- Automatic cleanup with setTimeout
- Toast queue prevents UI clutter

## Integration Example

Here's a complete example of integrating badge notifications when a user completes an action:

```tsx
import { useBadgeNotifications } from "@/lib/hooks/useBadgeNotifications";

export function ProjectLauncher() {
  const { showBadgeEarned } = useBadgeNotifications();
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      const project = await launchProject();

      // Check if user earned a badge
      if (project.badges?.length > 0) {
        for (const badge of project.badges) {
          showBadgeEarned({
            id: badge.id,
            name: badge.name,
            emoji: badge.emoji,
            description: badge.description,
          });
        }
      }
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <button onClick={handleLaunch} disabled={isLaunching}>
      {isLaunching ? "Launching..." : "Launch Project"}
    </button>
  );
}
```

## Browser Support

- Modern browsers with CSS animations support
- Chrome, Firefox, Safari, Edge (all recent versions)
- Mobile browsers included

## Troubleshooting

### Toasts not appearing
- Ensure `BadgeNotificationContainer` is rendered in your layout
- Check that `useBadgeNotifications` is being used in the same component tree
- Verify z-50 doesn't conflict with other fixed elements

### Animation not smooth
- Check that CSS animations are supported in your browser
- Verify no CSS reset is removing animation rules
- Check for conflicting CSS transforms on parent elements

### Multiple toasts overlapping
- The container automatically stacks toasts with vertical offset
- If custom positioning is needed, modify `BadgeNotificationContainer.tsx`
