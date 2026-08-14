# POWDetailModal Component

A comprehensive Proof-of-Work (POW) score detail modal for LogoutDev user profiles. Displays a detailed breakdown of how a user's POW score is calculated across five categories.

## Features

- 📊 **Circular Progress Display**: Visual representation of overall POW score (0-100)
- 📈 **Five Score Categories**: 
  - **Commits & Contributions** (emerald): Commits, PRs merged, code reviews
  - **Projects** (sky): Project launches, open-source contributions
  - **Community** (violet): Posts, comments, helpful answers
  - **Consistency** (amber): Streaks, activity days
  - **Quality** (rose): Stars received, endorsements
- 📋 **Detailed Breakdown**: For each category:
  - Category name with themed icon
  - Points earned / maximum possible
  - Animated progress bar
  - List of contributing activities with counts
- 💡 **Improvement Tips**: 5 actionable tips for boosting the POW score
- 🎨 **Dark Theme**: Zinc-based color scheme with category-specific accent colors
- ♿ **Accessible**: Proper ARIA labels, keyboard navigation support

## Props

```typescript
interface POWDetailModalProps {
  isOpen: boolean;      // Controls modal visibility
  onClose: () => void;  // Callback when modal should close
  username: string;     // Username to display in header
  score: number;        // POW score (0-100)
  percentile: number;   // User's percentile rank (e.g., 85)
}
```

## Usage

```tsx
'use client';

import { useState } from 'react';
import POWDetailModal from '@/components/profile/POWDetailModal';

export default function ProfilePage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button onClick={() => setModalOpen(true)}>
        View POW Details
      </button>

      <POWDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        username="johndoe"
        score={82}
        percentile={78}
      />
    </>
  );
}
```

## Design Details

### Color Scheme
- **Emerald** (#10b981): Commits & Contributions
- **Sky** (#0ea5e9): Projects
- **Violet** (#a855f7): Community
- **Amber** (#f59e0b): Consistency
- **Rose** (#f43f5e): Quality

### Mock Data
The component uses procedurally generated mock data based on the provided score:
- Categories scale proportionally to the total score
- Each category has pre-defined maximum points
- Activities and counts are generated from sample data

### Layout
- **Mobile**: Single column layout with stacked content
- **Desktop (lg)**: Two-column layout with circular progress on the left, quick stats on the right
- **Modal**: Full-width responsive container with max-width 4xl

## Components Used

- **Icons**: From `@/components/ui/Icons`
  - `SparklesIcon`: Main header icon
  - `CodeBracketIcon`: Commits category
  - `RocketIcon`: Projects category
  - `UsersIcon`: Community category
  - `ClockIcon`: Consistency category
  - `StarIcon`: Quality category
  - `AwardIcon`: Improvement tips icon
  - `XIcon`: Close button

- **Styling**: Tailwind CSS with dark theme (zinc-900 base)

## Animation Details

- **Progress Bars**: 700ms smooth transition with `transition-all duration-700`
- **Circular Progress**: SVG-based with stroke-dasharray animation
- **Modal**: Backdrop blur effect with smooth fade-in

## Accessibility

- ✅ Semantic HTML with proper heading hierarchy
- ✅ ARIA labels on interactive elements
- ✅ Keyboard accessible close button
- ✅ Color-coded information (not color-only)
- ✅ High contrast text on dark background
- ✅ Screen reader friendly

## States

- **Closed**: Modal is not rendered
- **Open**: Modal displayed with backdrop
- **Score Ranges**:
  - 70-100: Emerald (Strong)
  - 50-69: Sky (Growing)
  - 0-49: Zinc/Amber (Early)

## Future Enhancements

- [ ] Connect to real API data instead of mock data
- [ ] Add activity filtering and time range selection
- [ ] Export score breakdown as PDF
- [ ] Share modal link with custom score snapshot
- [ ] Detailed graphs and trends over time
- [ ] Category-specific drill-down pages

## Performance

- Minimal re-renders with proper component structure
- SVG-based circular progress (no canvas, minimal DOM)
- Lazy-loaded with modal pattern (only renders when open)
- No external dependencies beyond existing project utilities

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with responsive layout
