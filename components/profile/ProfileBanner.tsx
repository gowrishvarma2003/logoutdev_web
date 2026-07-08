"use client";

import { useRef, useState } from "react";
import { CameraIcon, XIcon } from "@/components/ui/Icons";
import Spinner from "@/components/ui/Spinner";

interface ProfileBannerProps {
  bannerUrl?: string | null;
  isMe: boolean;
  onUpload?: (file: File) => Promise<unknown>;
  onRemove?: () => Promise<unknown>;
}

export default function ProfileBanner({
  bannerUrl,
  isMe,
  onUpload,
  onRemove,
}: ProfileBannerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const hasBanner = Boolean(bannerUrl) && !imgError;

  const handleFile = async (file: File) => {
    if (!onUpload) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Banner must be 8MB or smaller.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onUpload(file);
      setImgError(false);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setBusy(true);
    setError(null);
    try {
      await onRemove();
      setImgError(false);
    } catch {
      setError("Could not remove banner.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative w-full h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 overflow-hidden group/banner">
      {/* Banner image */}
      {hasBanner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={bannerUrl as string}
          alt="Profile banner"
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 240px at 15% -20%, rgba(56,189,248,0.18), transparent 60%), radial-gradient(700px 220px at 95% 140%, rgba(139,92,246,0.18), transparent 65%)",
          }}
        />
      )}

      {/* Subtle gradient fade into the card below */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />

      {/* Owner controls */}
      {isMe && (onUpload || onRemove) ? (
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {hasBanner && onRemove ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg bg-app/70 backdrop-blur px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-app/90 transition-colors disabled:opacity-60"
              aria-label="Remove banner"
            >
              <XIcon className="w-3.5 h-3.5" />
              Remove
            </button>
          ) : null}
          {onUpload ? (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg bg-app/70 backdrop-blur px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:bg-app/90 transition-colors disabled:opacity-60"
                aria-label="Upload banner"
              >
                {busy ? <Spinner size="sm" /> : <CameraIcon className="w-3.5 h-3.5" />}
                {hasBanner ? "Change" : "Add banner"}
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
        </div>
      ) : null}

      {error ? (
        <div className="absolute left-3 bottom-3 rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-[11px] text-rose-200">
          {error}
        </div>
      ) : null}
    </div>
  );
}
