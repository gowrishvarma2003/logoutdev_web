# Portfolio Management UI - LogoutDev Settings

## Overview

A complete portfolio management interface for LogoutDev settings that allows users to create, edit, delete, and organize portfolio items to showcase their work on their developer profiles.

## Components Created

### 1. **Portfolio Page** (`app/(app)/settings/profile/portfolio/page.tsx`)
Main portfolio management page accessible at `/settings/profile/portfolio`

**Features:**
- List all portfolio items
- Add new portfolio items via button
- Edit existing items
- Delete items with confirmation
- Reorder items with up/down buttons
- Empty state with call-to-action
- Loading states and error handling
- LocalStorage persistence (mock backend)

**Key Functionality:**
- Sticky header with back navigation
- Search/filter friendly section title
- Add item button (top and inline)
- Portfolio items grid/list display
- Add another item button at bottom

### 2. **PortfolioItemForm** (`components/settings/PortfolioItemForm.tsx`)
Form component for creating and editing portfolio items

**Exported Interface:**
```typescript
export interface PortfolioItemFormData {
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  demoUrl?: string;
  repoUrl?: string;
  technologies: string[];
}
```

**Fields:**
- **Title** (required): Project name/title
- **Description** (required): Brief project description (max 250 chars)
- **Thumbnail Image URL**: Direct link to project image
- **Live Demo URL**: Link to live demo (with URL validation)
- **Repository URL**: Link to source code (with URL validation)
- **Technologies & Tools**: Tag-based technology input
  - Add technologies with "Enter" or "Add" button
  - Remove tags with X button
  - Shows running count

**Validation:**
- Required fields: title, description
- URL format validation for all URL fields
- Real-time character count for description
- Error messages displayed inline

**Props:**
- `item?`: Optional item to edit (if undefined, form is in create mode)
- `onSave`: Callback when form is submitted
- `onCancel`: Callback when cancel button clicked
- `loading?`: Boolean to disable form while saving

### 3. **PortfolioItemCard** (`components/settings/PortfolioItemCard.tsx`)
Compact card view for displaying portfolio items in the settings page

**Features:**
- Thumbnail image (160x160px) with fallback icon
- Title (truncated)
- Description (line-clamped to 2 lines)
- Technology tags (shows 4, +N more)
- External links to demo and repo
- Action buttons:
  - Edit button
  - Delete button (with confirmation)
  - Move up/down buttons for reordering
- Hover effects and responsive design
- Loading state while deleting

**Props:**
- `item`: PortfolioItemFormData to display
- `onEdit`: Callback when edit button clicked
- `onDelete`: Callback for delete action
- `onMoveUp?`: Optional callback to move item up
- `onMoveDown?`: Optional callback to move item down
- `canMoveUp?`: Whether move up is allowed
- `canMoveDown?`: Whether move down is allowed
- `isDeleting?`: Show loading state during deletion

## Integration

### Link from Profile Settings
The portfolio management link is added to `/settings/profile` page:

```typescript
<Link
  href="/settings/profile/portfolio"
  className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors whitespace-nowrap"
>
  <BriefcaseIcon className="w-3.5 h-3.5" />
  Manage
</Link>
```

### Icon Addition
Added `BriefcaseIcon` to `components/ui/Icons.tsx` for portfolio theming.

## Data Persistence

Currently uses **localStorage** for demo purposes:
- Key: `user_portfolio_items`
- Format: JSON array of PortfolioItemFormData

**For Production:**
Replace localStorage implementation in portfolio page with API calls:
```typescript
// Replace these functions with actual API endpoints:
async function fetchPortfolioItems() {
  const response = await fetch('/api/user/portfolio', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

async function savePortfolioItem(item) {
  const method = item.id ? 'PUT' : 'POST';
  const url = item.id ? `/api/user/portfolio/${item.id}` : '/api/user/portfolio';
  return fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
}
```

## Styling

All components use consistent styling from LogoutDev design system:
- **Colors**: Zinc and sky color palette
- **Borders**: Subtle zinc-700/800 borders
- **Backgrounds**: Semi-transparent zinc-900/50
- **Spacing**: Consistent padding and gaps
- **Hover States**: Color transitions and background changes
- **Accessibility**: ARIA labels, focus states, keyboard navigation

## Accessibility Features

✅ ARIA labels on all buttons
✅ Proper form labels and error messages
✅ Keyboard navigation (Tab, Enter)
✅ Focus management
✅ Loading states with visual feedback
✅ Error announcements
✅ Alt text for images
✅ Semantic HTML structure

## Usage Example

### Basic Portfolio Page with API Integration
```typescript
export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItemFormData[]>([]);

  const handleSaveItem = async (formData: PortfolioItemFormData) => {
    const method = formData.id ? 'PUT' : 'POST';
    const url = formData.id 
      ? `/api/portfolio/${formData.id}` 
      : '/api/portfolio';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) throw new Error('Save failed');
    const saved = await response.json();
    
    setItems(items.map(item => 
      item.id === saved.id ? saved : item
    ).concat(!formData.id ? saved : []));
  };

  const handleDeleteItem = async (id: string) => {
    await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
    setItems(items.filter(item => item.id !== id));
  };

  return (
    // Portfolio UI components
  );
}
```

## Files Created

```
app/(app)/settings/profile/portfolio/
├── page.tsx                          # Main portfolio management page

components/settings/
├── PortfolioItemForm.tsx            # Form for creating/editing items
├── PortfolioItemCard.tsx            # Card display component
└── (uses existing PortfolioImageUpload.tsx for optional image uploads)

components/ui/
└── Icons.tsx                        # Updated with BriefcaseIcon
```

## Testing Checklist

- [ ] Navigate to `/settings/profile/portfolio`
- [ ] Add new portfolio item with all fields
- [ ] Edit existing portfolio item
- [ ] Delete portfolio item with confirmation
- [ ] Reorder items with up/down buttons
- [ ] Validate URL fields with invalid URLs
- [ ] View error messages for required fields
- [ ] Test empty state
- [ ] Verify localStorage persistence
- [ ] Test mobile responsiveness
- [ ] Verify keyboard navigation
- [ ] Test loading states
- [ ] Verify links to demo/repo work

## Future Enhancements

1. **Drag-and-drop Reordering**: Replace up/down buttons with drag handles
2. **Image Upload**: Integrate PortfolioImageUpload for direct image uploads
3. **Image Preview**: Show live preview of portfolio images
4. **Analytics**: Track portfolio views and clicks
5. **Sharing**: Share portfolio link directly
6. **Templates**: Pre-built portfolio item templates
7. **Bulk Actions**: Select multiple items for batch delete
8. **Export**: Export portfolio as PDF or JSON
9. **Public Gallery**: Responsive public portfolio display page
10. **SEO Optimization**: Meta tags for portfolio items

## Dependencies

- React 18+
- Next.js 16+
- TypeScript
- Tailwind CSS (styling)
- Existing LogoutDev UI components (Icons, Spinner, SettingsSection, etc.)

## Notes

- Form uses controlled components for all inputs
- Technology tags are case-insensitive (converted to lowercase)
- Descriptions are limited to 250 characters with live counter
- Images are displayed at 160x160px on cards, full-size in modal
- Mobile responsive with full touch support
- All form submissions show loading state
- Delete confirmation prevents accidental data loss
