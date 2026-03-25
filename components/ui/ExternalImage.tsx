"use client";

import { useState, useEffect, useMemo } from "react";
import { SparklesIcon } from "./Icons";

interface ExternalImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Transforms various cloud storage URLs to direct image URLs
 */
function transformImageUrl(url: string): string {
  if (!url) return "";

  // Google Drive links
  // Format: https://drive.google.com/file/d/FILE_ID/view
  // Transform to: https://drive.google.com/uc?export=view&id=FILE_ID
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveFileMatch[1]}`;
  }

  // Google Drive direct link (already correct format)
  // Format: https://drive.google.com/uc?id=FILE_ID
  if (url.includes("drive.google.com/uc")) {
    // Ensure it has export=view parameter
    if (!url.includes("export=")) {
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
      }
    }
    return url;
  }

  // Google Drive open link
  // Format: https://drive.google.com/open?id=FILE_ID
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveOpenMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveOpenMatch[1]}`;
  }

  // Dropbox links
  // Format: https://www.dropbox.com/s/xxx/file.jpg?dl=0
  // Transform to: https://dl.dropboxusercontent.com/s/xxx/file.jpg
  if (url.includes("dropbox.com")) {
    return url
      .replace("www.dropbox.com", "dl.dropboxusercontent.com")
      .replace("?dl=0", "")
      .replace("?dl=1", "");
  }

  // OneDrive/SharePoint links
  // Format: https://1drv.ms/xxx or https://onedrive.live.com/xxx
  // These are harder to transform - try adding download parameter
  if (url.includes("1drv.ms") || url.includes("onedrive.live.com")) {
    // OneDrive embed format
    if (!url.includes("download=1")) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}download=1`;
    }
    return url;
  }

  // iCloud links - these generally don't work directly
  // We'll try them as-is and let the error handler deal with it

  // Imgur - ensure direct image URL
  // Format: https://imgur.com/a/xxx or https://imgur.com/xxx
  // Transform to: https://i.imgur.com/xxx.jpg
  const imgurMatch = url.match(/imgur\.com\/(?:a\/)?([a-zA-Z0-9]+)$/);
  if (imgurMatch && !url.includes("i.imgur.com")) {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
  }

  // GitHub raw content - ensure raw URL
  // Format: https://github.com/user/repo/blob/branch/path/image.png
  // Transform to: https://raw.githubusercontent.com/user/repo/branch/path/image.png
  if (url.includes("github.com") && url.includes("/blob/")) {
    return url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");
  }

  // Firebase Storage - these should work as-is if properly configured

  // AWS S3 - these should work as-is if public

  // Cloudinary - these should work as-is

  // Generic: return as-is
  return url;
}

/**
 * Checks if a URL is a valid image URL format
 */
function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|avif)(\?.*)?$/i;
  if (imageExtensions.test(url)) return true;

  // Check for known image hosting services
  const imageHosts = [
    "i.imgur.com",
    "imgur.com",
    "drive.google.com",
    "dl.dropboxusercontent.com",
    "raw.githubusercontent.com",
    "cloudinary.com",
    "res.cloudinary.com",
    "images.unsplash.com",
    "firebasestorage.googleapis.com",
    "storage.googleapis.com",
    "s3.amazonaws.com",
    "blob.core.windows.net",
  ];

  return imageHosts.some((host) => url.includes(host));
}

/**
 * ExternalImage component that handles various image URL sources
 * including Google Drive, Dropbox, GitHub, and other cloud storage services
 */
export default function ExternalImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  onLoad,
  onError,
}: ExternalImageProps) {
  // Transform URL immediately (not in useEffect) to avoid empty src
  const initialTransformedUrl = useMemo(() => transformImageUrl(src), [src]);
  
  const [imageSrc, setImageSrc] = useState<string>(initialTransformedUrl);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Reset state and update URL when src changes
    setHasError(false);
    setIsLoading(true);
    setRetryCount(0);
    setImageSrc(transformImageUrl(src));
  }, [src]);

  const handleError = () => {
    // Try alternative transformations on error
    if (retryCount === 0 && src.includes("drive.google.com")) {
      // Try thumbnail API for Google Drive
      const idMatch = src.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        setImageSrc(`https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`);
        setRetryCount(1);
        return;
      }
    }

    // If retries exhausted or no alternative, show error
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  // Show fallback placeholder if error or no valid source
  if (hasError || !src || !imageSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-900 ${fallbackClassName || className}`}
      >
        <div className="flex flex-col items-center gap-2 text-zinc-600">
          <SparklesIcon className="h-8 w-8" />
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-zinc-800" />
      )}

      {/* Image */}
      <img
        src={imageSrc}
        alt={alt}
        className={`h-full w-full ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        style={{ objectFit: "inherit" }}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

/**
 * Hook to transform image URLs for use outside the component
 */
export function useTransformedImageUrl(url: string): string {
  return transformImageUrl(url);
}

/**
 * Utility to check if URL is likely a valid image
 */
export { isValidImageUrl, transformImageUrl };
