"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { XIcon, CheckIcon } from "@/components/ui/Icons";
import Spinner from "@/components/ui/Spinner";

interface AvatarCropModalProps {
  src: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

export default function AvatarCropModal({
  src,
  onCancel,
  onConfirm,
}: AvatarCropModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });

  // Dimensions of our cropping guide
  const cropDiameter = 224; // w-56 h-56 is 224px

  // Calculate base scale so the image covers the circular guide (diameter)
  const baseScale = (() => {
    if (!naturalWidth || !naturalHeight) return 1;
    return cropDiameter / Math.min(naturalWidth, naturalHeight);
  })();

  // Constrain position so that the circular guide never goes out of the image boundaries
  const constrainPosition = useCallback(
    (x: number, y: number, currentZoom: number) => {
      if (!naturalWidth || !naturalHeight) return { x: 0, y: 0 };
      const W = naturalWidth * baseScale * currentZoom;
      const H = naturalHeight * baseScale * currentZoom;

      const maxX = Math.max(0, (W - cropDiameter) / 2);
      const maxY = Math.max(0, (H - cropDiameter) / 2);

      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
    },
    [naturalWidth, naturalHeight, baseScale]
  );

  // Recalculate constrained position when zoom changes
  useEffect(() => {
    setPosition((prev) => constrainPosition(prev.x, prev.y, zoom));
  }, [zoom, constrainPosition]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalWidth(img.naturalWidth);
    setNaturalHeight(img.naturalHeight);
    setImageLoaded(true);
  };

  // Drag Gesture Handlers (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!imageLoaded) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { ...position };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const newPos = constrainPosition(
        positionStartRef.current.x + dx,
        positionStartRef.current.y + dy,
        zoom
      );
      setPosition(newPos);
    },
    [isDragging, zoom, constrainPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Drag Gesture Handlers (Touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageLoaded || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    positionStartRef.current = { ...position };
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      const newPos = constrainPosition(
        positionStartRef.current.x + dx,
        positionStartRef.current.y + dy,
        zoom
      );
      setPosition(newPos);
    },
    [isDragging, zoom, constrainPosition]
  );

  // Global mousemove/mouseup binding to support dragging outside container
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Export cropped area using Canvas
  const handleConfirm = async () => {
    if (!imageLoaded || !imgRef.current || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const img = imgRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas context.");

      // Calculate crop metrics on natural size
      const currentScale = baseScale * zoom;
      const cropSize = cropDiameter / currentScale;

      const sx = (naturalWidth - cropSize) / 2 - position.x / currentScale;
      const sy = (naturalHeight - cropSize) / 2 - position.y / currentScale;

      // Draw the cropped section onto canvas
      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, 400, 400);

      // Convert to blob and call confirm
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError("Failed to generate cropped image blob.");
            setSubmitting(false);
            return;
          }
          const croppedFile = new File([blob], "avatar.jpg", {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          onConfirm(croppedFile);
        },
        "image/jpeg",
        0.9
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cropping failed.");
      setSubmitting(false);
    }
  };

  // Preview ratios (Preview circle is w-24 h-24 which is 96px)
  const previewSize = 96;
  const previewRatio = previewSize / cropDiameter;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-xl animate-fade-in animate-duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col md:grid md:grid-cols-[1fr_220px] overflow-hidden">
        
        {/* Left pane: Cropper Workspace */}
        <div className="p-6 border-b border-zinc-800 md:border-b-0 md:border-r border-zinc-800 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Crop Profile Photo</h3>
            <button
              type="button"
              onClick={onCancel}
              className="p-1 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Drag & Drop Crop Container */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="relative w-72 h-72 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center cursor-move"
          >
            {/* Source Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Source"
              onLoad={handleImageLoad}
              className="absolute max-w-none max-h-none select-none pointer-events-none origin-center"
              style={{
                width: naturalWidth ? `${naturalWidth}px` : "auto",
                height: naturalHeight ? `${naturalHeight}px` : "auto",
                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${baseScale * zoom})`,
                left: "50%",
                top: "50%",
                opacity: imageLoaded ? 1 : 0,
              }}
            />

            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spinner size="md" />
              </div>
            )}

            {/* Circular Mask Overlay (box-shadow cutout technique) */}
            <div
              className="absolute w-56 h-56 rounded-full border-2 border-white/40 pointer-events-none"
              style={{
                boxShadow: "0 0 0 9999px rgba(9, 9, 11, 0.75)",
              }}
            />
          </div>

          {/* Zoom controls */}
          <div className="w-full mt-5 space-y-2">
            <div className="flex justify-between text-xs text-zinc-400">
              <span>Zoom</span>
              <span className="font-semibold text-white">{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              disabled={!imageLoaded || submitting}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>

        {/* Right pane: Preview & CTAs */}
        <div className="p-6 bg-zinc-900/50 flex flex-col items-center justify-between gap-6">
          <div className="flex flex-col items-center text-center space-y-4 w-full">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Preview</h4>
            
            {/* Live circular preview container */}
            <div className="w-24 h-24 rounded-full overflow-hidden border border-zinc-800 bg-zinc-950 relative shadow-inner">
              {imageLoaded && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt="Preview crop"
                  className="absolute max-w-none max-h-none select-none pointer-events-none origin-center"
                  style={{
                    width: `${naturalWidth}px`,
                    height: `${naturalHeight}px`,
                    transform: `translate(-50%, -50%) translate(${position.x * previewRatio}px, ${position.y * previewRatio}px) scale(${baseScale * zoom * previewRatio})`,
                    left: "50%",
                    top: "50%",
                  }}
                />
              )}
            </div>
            <p className="text-[10px] text-zinc-500 max-w-[160px] leading-relaxed">
              This circular frame shows exactly how your photo appears to others across LogoutDev.
            </p>
          </div>

          <div className="w-full space-y-2.5">
            {error && <p className="text-[11px] text-rose-400 text-center">{error}</p>}
            
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!imageLoaded || submitting}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="w-3.5 h-3.5" />
                  Apply Photo
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="w-full py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:text-white hover:border-zinc-700 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
