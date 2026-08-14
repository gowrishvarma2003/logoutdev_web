# Badge Earned Notifications - Quick Start

Get badge notifications running in 5 minutes!

## Step 1: Update Your Root Layout (app/layout.tsx)

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
        {/* Add this line to enable badge toasts */}
        <BadgeNotificationContainer badges={badges} onRemove={removeBadge} />
      </body>
    </html>
  );
}
```

## Step 2: Use in Your Component

```tsx
import { useBadgeNotifications } from "@/lib/hooks/useBadgeNotifications";

export function MyComponent() {
  const { showBadgeEarned } = useBadgeNotifications();

  const handleAction = () => {
    // Show a badge notification
    showBadgeEarned({
      name: "First Launch",
      emoji: "🚀",
      description: "Launched your first project!",
    });
  };

  return <button onClick={handleAction}>Take Action</button>;
}
```

## Step 3: Test It!

Click a button that calls `showBadgeEarned()` and you should see a beautiful toast in the bottom-right corner!

---

## Common Badge Examples

```tsx
// First launch
showBadgeEarned({
  name: "First Launch",
  emoji: "🚀",
  description: "Launched your first project!",
});

// Achievement
showBadgeEarned({
  name: "Achievement Unlocked",
  emoji: "🏆",
  description: "Completed your first milestone!",
});

// Streak
showBadgeEarned({
  name: "7-Day Streak",
  emoji: "🔥",
  description: "Logged in every day this week!",
});

// Expert
showBadgeEarned({
  name: "Expert Developer",
  emoji: "💻",
  description: "Reached expert level in 3 skills!",
});

// Team
showBadgeEarned({
  name: "Team Player",
  emoji: "🤝",
  description: "Collaborated with 10 developers!",
});
```

---

## API Integration

When your API returns earned badges:

```tsx
const handleLaunchProject = async () => {
  const response = await fetch("/api/projects/launch", {
    method: "POST",
    body: JSON.stringify(data),
  });

  const result = await response.json();

  // Show any badges earned
  if (result.badges?.length > 0) {
    for (const badge of result.badges) {
      showBadgeEarned({
        id: badge.id,
        name: badge.name,
        emoji: badge.emoji,
        description: badge.description,
      });
    }
  }
};
```

---

## Features

✨ **Beautiful animations** - Slide in/out, floating emoji, sparkles  
⏱️ **Auto-dismiss** - Closes after 5 seconds (or click close)  
📱 **Mobile friendly** - Responsive design  
♿ **Accessible** - Screen reader support, keyboard navigation  
🚀 **Fast** - CSS animations, GPU accelerated  
📦 **No dependencies** - Pure React + Tailwind CSS  

---

## Customization

### Change auto-dismiss time
```tsx
<BadgeEarnedToast 
  badge={badge}
  onClose={onClose}
  autoCloseDuration={7000}  // 7 seconds instead of 5
/>
```

### Change colors
Edit Tailwind classes in `BadgeEarnedToast.tsx`:
- Background: `from-purple-900 to-indigo-900`
- Button: `bg-purple-600 hover:bg-purple-500`
- Text: `text-purple-100`

### Change button link
Edit the `href` in `BadgeEarnedToast.tsx`:
```tsx
<Link href="/your-achievements-page">
  View Badge →
</Link>
```

---

## Troubleshooting

❌ **Toasts not appearing?**
- Make sure `BadgeNotificationContainer` is in your root layout
- Check browser console for errors

❌ **Animation too fast/slow?**
- Edit animation durations in `BadgeEarnedToast.tsx`
- Modify `@keyframes` or animation timing

❌ **Wrong position?**
- Modify `bottom-4 right-4` classes for different corner
- Or edit `BadgeNotificationContainer.tsx`

---

## Next Steps

1. ✅ Add to root layout
2. ✅ Use in components
3. ✅ Connect to your API
4. ✅ Define badge catalog
5. ✅ Celebrate your achievements! 🎉

---

## Documentation

- **Full docs**: `components/notifications/README.md`
- **Examples**: `components/notifications/EXAMPLES.tsx`
- **Implementation**: `components/notifications/IMPLEMENTATION_SUMMARY.md`

---

**Ready to celebrate achievements! 🎉**
