"use client";

import { useState, useRef } from "react";
import { getAvatarColor, getInitials } from "@/lib/utils";

interface AvatarProps {
  user?: { id: string; name: string; email?: string; avatar_url?: string | null } | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_CLASSES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-24 h-24 text-2xl",
};

export default function Avatar({
  user,
  size = "md",
  className = "",
}: AvatarProps) {
  const label = user?.name || user?.email || "?";
  const initials = getInitials(label);
  const color = getAvatarColor(user?.id || "default");
  const avatarUrl = user?.avatar_url;

  const [imgError, setImgError] = useState(false);
  const prevUrlRef = useRef(avatarUrl);

  // Reset error state when the URL changes (e.g. after upload) — derived-state
  // pattern recommended by React for resetting state on prop change.
  if (prevUrlRef.current !== avatarUrl) {
    prevUrlRef.current = avatarUrl;
    setImgError(false);
  }

  const sizeClass = SIZE_CLASSES[size];

  if (avatarUrl && !imgError) {
    return (
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center shrink-0 select-none relative ${color} ${className}`}
        aria-label={label}
        title={label}
      >
        <img
          src={avatarUrl}
          alt={label}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-semibold text-text-primary shrink-0 select-none ${className}`}
      aria-label={label}
      title={label}
    >
      {initials}
    </div>
  );
}
