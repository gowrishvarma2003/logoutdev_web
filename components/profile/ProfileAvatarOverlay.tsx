"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Spinner from "@/components/ui/Spinner";
import { CameraIcon, EyeIcon, XIcon } from "@/components/ui/Icons";
import type { User } from "@/lib/types";
import { getInitials } from "@/lib/utils";
import AvatarCropModal from "./AvatarCropModal";

interface ProfileAvatarOverlayProps {
  user: User;
  isMe: boolean;
  onUpload?: (file: File) => Promise<unknown>;
}

export default function ProfileAvatarOverlay({
  user,
  isMe,
  onUpload,
}: ProfileAvatarOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!onUpload) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar must be 5MB or smaller.");
      return;
    }
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (croppedFile: File) => {
    setCropSrc(null);
    setBusy(true);
    try {
      await onUpload?.(croppedFile);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative shrink-0">
      {/* Clickable avatar container to trigger Lightbox viewer */}
      <div
        onClick={() => setShowLightbox(true)}
        className="group relative cursor-pointer -mt-12 sm:-mt-14 shrink-0 rounded-full"
      >
        <Avatar
          user={user}
          size="xl"
          className="ring-4 ring-app shadow-xl shadow-black/40"
        />
        {/* Hover overlay magnifying glass */}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
          <EyeIcon className="w-6 h-6 text-text-primary/95" />
        </div>
      </div>

      {isMe && onUpload ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            disabled={busy}
            className="absolute bottom-1 right-1 flex items-center justify-center w-7 h-7 rounded-full bg-surface-hover border border-border-strong text-text-secondary hover:bg-surface-active hover:text-text-primary transition-colors disabled:opacity-60 cursor-pointer z-10"
            aria-label="Change avatar"
            title="Change avatar"
          >
            {busy ? <Spinner size="sm" /> : <CameraIcon className="w-3.5 h-3.5" />}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </>
      ) : null}

      {error ? (
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-[11px] text-rose-200">
          {error}
        </div>
      ) : null}

      {/* Lightbox Modal */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-app/95 backdrop-blur-md animate-fade-in animate-duration-200"
          onClick={() => setShowLightbox(false)}
        >
          {/* Close Button */}
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="p-2 rounded-full bg-surface border border-border-default text-text-muted hover:text-text-primary hover:border-border-strong transition-colors cursor-pointer"
              aria-label="Close photo view"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Photo Display Card */}
          <div
            className="relative max-w-md w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-border-default shadow-2xl bg-surface flex items-center justify-center relative">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-5xl font-bold text-text-disabled select-none">
                  {getInitials(user.name)}
                </div>
              )}
            </div>
            <p className="mt-4 text-base font-bold text-text-primary leading-tight">{user.name}</p>
            {user.username && <p className="text-xs text-text-disabled mt-1">@{user.username}</p>}
          </div>
        </div>
      )}

      {/* Avatar Crop Modal */}
      {cropSrc && (
        <AvatarCropModal
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
