# Portfolio Image Upload Integration Guide

## Overview

The `PortfolioImageUpload` component provides a complete image management solution for portfolio items in LogoutDev. It includes drag-and-drop upload, image preview, crop/resize functionality, and a mock upload system.

## Components Created

### 1. **PortfolioImageUpload.tsx**
Main component for handling image uploads with advanced features.

**Location:** `components/settings/PortfolioImageUpload.tsx`

**Features:**
- ✅ Drag-and-drop file upload
- ✅ File input fallback (click to select)
- ✅ Image preview before upload
- ✅ Crop/resize with aspect ratio lock
- ✅ Progress indicator (0-100%)
- ✅ File validation:
  - Max 5MB
  - Formats: JPG, PNG, WebP, GIF
- ✅ Smooth zoom and pan controls
- ✅ Canvas-based image processing

**Props:**
```typescript
interface PortfolioImageUploadProps {
  currentImage?: string;        // Current image URL (if editing)
  onUpload: (imageUrl: string) => void;  // Callback with new image URL
  aspectRatio?: number;         // Lock aspect ratio (default: 16/9)
  disabled?: boolean;           // Disable upload
}
```

**Usage Example:**
```tsx
import PortfolioImageUpload from "@/components/settings/PortfolioImageUpload";

function MyComponent() {
  const [imageUrl, setImageUrl] = useState("");

  return (
    <PortfolioImageUpload
      currentImage={imageUrl}
      onUpload={setImageUrl}
      aspectRatio={16 / 9}
    />
  );
}
```

### 2. **Integration with PortfolioItemForm**

The `PortfolioImageUpload` component has been integrated into `PortfolioItemForm.tsx`.

**Changes Made:**
- Replaced plain text URL input with `PortfolioImageUpload` component
- Users can now upload/drag-drop images directly
- Maintains backward compatibility with URL inputs through fallback

**Updated Field:**
```tsx
<SettingsField
  label="Project Image"
  hint="Upload or provide an image URL"
  error={errors.imageUrl}
  htmlFor="portfolio-image"
>
  <PortfolioImageUpload
    currentImage={formData.imageUrl}
    onUpload={(imageUrl) => setFormData({ ...formData, imageUrl })}
    aspectRatio={16 / 9}
    disabled={isSubmitting}
  />
</SettingsField>
```

## File Details

### PortfolioImageUpload Component Structure

**State Management:**
- `isDragging` - Track drag-over state
- `selectedFile` - Current selected file
- `preview` - Preview image data URL
- `isUploading` - Upload in progress
- `uploadProgress` - Upload progress (0-100)
- `error` - Error message display
- `cropState` - Crop position and zoom level
- `showCropTools` - Show/hide crop interface

**Key Functions:**

1. **validateFile(file: File)** - Validates file type and size
2. **handleFileSelect(file: File)** - Processes selected file
3. **handleDragOver/handleDragLeave/handleDrop** - Drag-drop handlers
4. **handleCropChange** - Updates crop state
5. **performCropAndUpload** - Processes image and uploads
6. **mockUpload** - Simulates 2-second API upload delay

**Mock Upload Function:**
```tsx
const mockUpload = async (canvas: HTMLCanvasElement): Promise<string> => {
  return new Promise((resolve) => {
    // Simulate 2-second upload
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 2000) * 100, 95);
      setUploadProgress(progress);

      if (elapsed >= 2000) {
        clearInterval(interval);
        const imageUrl = canvas.toDataURL("image/webp", 0.9);
        setUploadProgress(100);
        resolve(imageUrl);
      }
    }, 50);
  });
};
```

## UI Workflow

### 1. Initial Upload State
```
┌─────────────────────────────────────┐
│  📤 Drag and drop your image here   │
│     or click to select a file       │
│     Max 5MB • jpg, png, webp, gif   │
└─────────────────────────────────────┘
```

### 2. Crop & Preview State
```
┌────────────────────────────────────┐
│ Adjust & Preview        [Clear]    │
├────────────────────────────────────┤
│                                    │
│         [Preview Image]            │
│                                    │
├────────────────────────────────────┤
│ Zoom:       [====●===] 120%        │
│ Horizontal: [==●=====] 0%          │
│ Vertical:   [====●===] 0%          │
│                                    │
│ Aspect ratio locked to 16.00:1     │
├────────────────────────────────────┤
│ Uploading...           [50%]       │
│ [████████░░░░░░░░░░░░░]            │
├────────────────────────────────────┤
│ [Upload Image] [Cancel]            │
└────────────────────────────────────┘
```

## Production Deployment Notes

### Converting Mock Upload to Real API

Replace the `mockUpload` function with actual API integration:

```tsx
// Before (mock):
const mockUpload = async (canvas: HTMLCanvasElement): Promise<string> => {
  // Simulated 2-second delay
  return new Promise((resolve) => { ... });
};

// After (real API):
const mockUpload = async (canvas: HTMLCanvasElement): Promise<string> => {
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), "image/webp", 0.9);
  });

  const formData = new FormData();
  formData.append("file", blob, "portfolio-image.webp");

  const response = await fetch("/api/upload/portfolio", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  const { url } = await response.json();
  return url;
};
```

### API Endpoint Example (Next.js)

**File:** `app/api/upload/portfolio/route.ts`

```typescript
import { writeFile } from "fs/promises";
import { join } from "path";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large" },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const fileName = `portfolio-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
    const uploadDir = join(process.cwd(), "public/uploads/portfolio");

    await writeFile(join(uploadDir, fileName), Buffer.from(bytes));

    return NextResponse.json({
      url: `/uploads/portfolio/${fileName}`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
```

## Styling & Theming

The component uses Tailwind CSS with LogoutDev's color scheme:
- **Primary:** Sky blue (`sky-500`, `sky-600`)
- **Background:** Zinc 900 (`zinc-900`, `zinc-800`)
- **Text:** Zinc 100/300 (`text-zinc-100`)
- **Borders:** Zinc 700 (`border-zinc-700`)

All styles are fully customizable through Tailwind classes in the component.

## Testing

### Unit Test Example
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import PortfolioImageUpload from "@/components/settings/PortfolioImageUpload";

describe("PortfolioImageUpload", () => {
  it("renders upload area initially", () => {
    const handleUpload = jest.fn();
    render(<PortfolioImageUpload onUpload={handleUpload} />);
    
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it("calls onUpload with image URL", async () => {
    const handleUpload = jest.fn();
    const { container } = render(
      <PortfolioImageUpload onUpload={handleUpload} />
    );

    // Simulate file drop
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const dropZone = container.querySelector("div");
    
    fireEvent.drop(dropZone!, { dataTransfer: { files: [file] } });
    // ... assert onUpload called
  });
});
```

## Accessibility Features

- ✅ Keyboard navigation (file input works with Tab/Enter)
- ✅ ARIA labels on buttons
- ✅ Disabled state management
- ✅ Error message display for validation
- ✅ High contrast colors for visibility

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers with File API support

**Note:** Canvas-based crop/resize requires modern browsers with HTML5 Canvas API.

## Performance Considerations

- **Image Processing:** Done on-client via Canvas API (no server overhead)
- **WebP Output:** High compression ratio (0.9 quality) reduces file sizes
- **1920px Output:** Fixed resolution ensures consistent quality
- **Lazy Loading:** Preview only generated on file selection

## Common Use Cases

### 1. Portfolio Item Creation
```tsx
<PortfolioItemForm
  onSave={async (item) => {
    await createPortfolioItem(item);
  }}
/>
```

### 2. Portfolio Item Update
```tsx
<PortfolioItemForm
  item={existingPortfolioItem}
  onSave={async (item) => {
    await updatePortfolioItem(item);
  }}
/>
```

### 3. Profile Avatar Upload
```tsx
<PortfolioImageUpload
  currentImage={profile.avatar_url}
  onUpload={(avatarUrl) => {
    updateProfile({ avatar_url: avatarUrl });
  }}
  aspectRatio={1} // Square for avatar
/>
```

## Troubleshooting

### Issue: Upload progress stuck at 0%
**Solution:** Check that `mockUpload` is being called and interval is running correctly.

### Issue: Image not showing preview
**Solution:** Ensure file is valid and within size limits. Check browser console for errors.

### Issue: Crop not working correctly
**Solution:** Verify Canvas API is supported. Check for CORS issues if image is from external source.

### Issue: Aspect ratio not locked
**Solution:** Ensure `aspectRatio` prop is a number (e.g., `16 / 9`, not `"16:9"`).

## Future Enhancements

- 🔄 Add image filters (brightness, contrast, saturation)
- 🎨 Add color adjustment sliders
- 📐 Add rotation capability
- 🖼️ Add watermark support
- 💾 Add save as different formats (PNG, JPG, WebP)
- 🔗 Add cloud storage integration (AWS S3, Cloudinary)
- 📱 Add mobile-specific optimizations

## Related Files

- `components/settings/PortfolioItemForm.tsx` - Integrated form
- `components/profile/PortfolioItem.tsx` - Display component
- `app/(app)/settings/profile/portfolio/page.tsx` - Settings page

## File Sizes

- `PortfolioImageUpload.tsx` - 14.3 KB
- `PortfolioItemForm.tsx` (updated) - 10.2 KB
- **Total:** 24.5 KB

---

**Last Updated:** 2024
**Maintainer:** LogoutDev Team
