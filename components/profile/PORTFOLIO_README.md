# Portfolio Showcase Components

Portfolio showcase components for displaying user projects and portfolios on LogoutDev profile pages.

## Components Overview

### 1. PortfolioItem.tsx
Individual portfolio card component that displays a single project with image, description, technologies, and action links.

**Key Features:**
- 16:9 aspect ratio image with fallback gradient
- Title and description with line clamping
- Technology tags (max 3 displayed + overflow count)
- Demo and repository links
- Hover effects with image zoom and overlay
- Click to expand in detail modal

**Props:**
```typescript
interface PortfolioItemProps {
  item: PortfolioItem;                    // Portfolio item data
  onExpand?: (item: PortfolioItem) => void;  // Expand/modal callback
}
```

### 2. PortfolioShowcase.tsx
Container component that manages a grid of portfolio items with empty states, modals, and add CTAs.

**Key Features:**
- Responsive grid layout (1→2→3 columns)
- Empty state with contextual messaging
- Detail modal for full project information
- "Add Portfolio Item" CTA (own profile only)
- Item counter display
- Smooth animations

**Props:**
```typescript
interface PortfolioShowcaseProps {
  items: PortfolioItem[];                    // Portfolio items to display
  showEmpty?: boolean;                       // Show empty state (default: true)
  isOwnProfile?: boolean;                    // Show add CTA (default: false)
  onAddPortfolioItem?: () => void;           // Add button callback
}
```

## Data Structure

```typescript
interface PortfolioItem {
  id: string;              // Unique identifier (required)
  title: string;           // Project title (required)
  description?: string;    // Project description
  image_url?: string;      // Screenshot/project image (16:9 recommended)
  demo_url?: string;       // Live demo/preview URL
  repo_url?: string;       // Repository URL (GitHub, etc.)
  tags?: string[];         // Technology tags (max 6+ recommended)
}
```

## Usage Examples

### Basic Usage
```tsx
import PortfolioShowcase from "@/components/profile/PortfolioShowcase";

const portfolio = [
  {
    id: "project-1",
    title: "E-Commerce Platform",
    description: "Full-stack platform with real-time inventory...",
    image_url: "https://example.com/image.jpg",
    demo_url: "https://demo.example.com",
    repo_url: "https://github.com/user/project",
    tags: ["Next.js", "TypeScript", "PostgreSQL"],
  },
];

export default function Portfolio() {
  return (
    <PortfolioShowcase items={portfolio} />
  );
}
```

### With Own Profile Features
```tsx
import { useState } from "react";
import PortfolioShowcase from "@/components/profile/PortfolioShowcase";

export default function MyPortfolio() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <PortfolioShowcase
        items={portfolioItems}
        isOwnProfile={true}
        onAddPortfolioItem={() => setShowAddModal(true)}
      />
      
      {showAddModal && (
        // Your add portfolio item form here
      )}
    </>
  );
}
```

## Styling

### Color Palette
- **Primary**: Zinc (brand color)
- **Demo links**: Sky 600
- **Code links**: Violet 600
- **Tags**: Sky, Violet, Emerald, Amber, Rose, Cyan (cycling)

### Responsive Breakpoints
- Mobile: 1 column grid
- Tablet (md): 2 column grid
- Desktop (lg): 3 column grid

## Features

### PortfolioItem
- ✅ 16:9 aspect ratio images
- ✅ Gradient fallback for missing images
- ✅ Image error handling
- ✅ Colorful technology tags
- ✅ Hover effects (zoom, overlay)
- ✅ Quick action buttons
- ✅ Click to expand modal
- ✅ Mobile responsive
- ✅ Accessible markup

### PortfolioShowcase
- ✅ Responsive grid layout
- ✅ Empty state handling
- ✅ Detail modal
- ✅ Add portfolio CTA (optional)
- ✅ Item counter
- ✅ Smooth animations
- ✅ Context-aware messaging
- ✅ Mobile optimized
- ✅ Production ready

## Animations

- **Card hover**: 300ms (border, shadow, background, lift)
- **Image zoom**: 300ms (105% on hover)
- **Overlay fade**: 300ms (dark overlay on hover)
- **Button scale**: 200ms (icon buttons scale on hover)
- **Modal entry**: 300ms (fade-in, zoom-in-95)

## Accessibility

- Semantic HTML structure
- Alt text on images
- Title attributes on links
- Keyboard navigation support
- Color contrast compliant
- Focus states on interactive elements
- Color-independent differentiation (tags use both color and position)

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Performance

- Uses Next.js Image component for optimization
- Client-side component with "use client" directive
- Minimal re-renders with proper state management
- CSS transitions for 60fps animations
- Lazy loading compatible

## Dependencies

- React (hooks: useState)
- Next.js (Image component)
- @primer/octicons-react (icons)
- Tailwind CSS (styling)

No additional external dependencies required.

## File Sizes

- PortfolioItem.tsx: 6.9 KB (198 lines)
- PortfolioShowcase.tsx: 11 KB (261 lines)

## Integration Tips

1. **Data Source**: Connect to your API/backend for real portfolio data
2. **Images**: Use images with 16:9 aspect ratio for best results
3. **Tags**: Keep to 3-6 tags per project for visual balance
4. **URLs**: Ensure demo and repo URLs are accessible
5. **Mobile Testing**: Test on various mobile devices for responsive grid
6. **Empty State**: Test with empty arrays to verify messaging
7. **Long Content**: Test with very long titles and descriptions

## Future Enhancements

- Portfolio item form modal
- Image carousel for multiple screenshots
- Filter/search functionality
- Sorting options (date, popularity, technology)
- Social sharing buttons
- Like/star functionality
- Comments system
- Portfolio analytics dashboard
- Drag-and-drop reordering
- Portfolio export as PDF

## Troubleshooting

### Images not loading
- Verify image URLs are accessible (CORS-enabled)
- Check image format support (JPEG, PNG, WebP)
- Component will show gradient fallback if image fails

### Modal not closing
- Click backdrop (dark area outside modal)
- Click X button in modal header
- Component handles click propagation properly

### Links not working
- Ensure URLs include protocol (https://)
- Links open in new tab by default
- Check external site allows your domain

### Responsive issues
- Verify Tailwind CSS breakpoints are configured
- Test with browser dev tools responsive mode
- Check grid column values in component

## Contact & Support

For issues or questions about these components, please refer to the LogoutDev component documentation.
