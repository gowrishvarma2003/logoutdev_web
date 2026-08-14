"use client";

/**
 * PortfolioImageUpload — Drag-and-drop image upload component for portfolio items
 * Features:
 * - Drag and drop file upload
 * - File input fallback
 * - Image preview with crop/resize functionality
 * - Aspect ratio lock (default 16:9)
 * - Upload progress indicator
 * - File size validation (max 5MB)
 * - Format validation (jpg, png, webp, gif)
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FORMATS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif";

interface CropState {
  x: number;
  y: number;
  scale: number;
}

export interface PortfolioImageUploadProps {
  currentImage?: string;
  onUpload: (imageUrl: string) => void;
  aspectRatio?: number; // default 16/9
  disabled?: boolean;
}

export default function PortfolioImageUpload({
  currentImage,
  onUpload,
  aspectRatio = 16 / 9,
  disabled = false,
}: PortfolioImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cropState, setCropState] = useState<CropState>({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [showCropTools, setShowCropTools] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return `Invalid file format. Accepted formats: ${ACCEPTED_EXTENSIONS}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 5MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }
    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setSelectedFile(file);
      setShowCropTools(true);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, handleFileSelect]
  );

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Update crop state
  const handleCropChange = (key: keyof CropState, value: number) => {
    setCropState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Mock upload function (simulates API delay)
  const mockUpload = async (canvas: HTMLCanvasElement): Promise<string> => {
    return new Promise((resolve) => {
      // Simulate upload delay (2 seconds)
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / 2000) * 100, 95);
        setUploadProgress(progress);

        if (elapsed >= 2000) {
          clearInterval(interval);
          // Convert canvas to data URL (in production, this would be uploaded to a server)
          const imageUrl = canvas.toDataURL("image/webp", 0.9);
          setUploadProgress(100);
          resolve(imageUrl);
        }
      }, 50);
    });
  };

  // Perform crop and upload
  const performCropAndUpload = async () => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;
    const containerWidth = img.parentElement?.offsetWidth || 400;
    const containerHeight = containerWidth / aspectRatio;

    // Set canvas dimensions
    canvas.width = 1920; // High quality output
    canvas.height = 1920 / aspectRatio;

    // Calculate source dimensions
    const scaledWidth = (img.naturalWidth * cropState.scale) / 100;
    const scaledHeight = (img.naturalHeight * cropState.scale) / 100;

    const sx = (img.naturalWidth - scaledWidth) / 2 + (cropState.x * img.naturalWidth) / 100;
    const sy = (img.naturalHeight - scaledHeight) / 2 + (cropState.y * img.naturalHeight) / 100;

    // Draw and crop image
    ctx.drawImage(
      img,
      sx,
      sy,
      scaledWidth,
      scaledHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    try {
      setIsUploading(true);
      setError(null);
      const imageUrl = await mockUpload(canvas);

      setUploadProgress(100);
      setTimeout(() => {
        onUpload(imageUrl);
        setPreview(imageUrl);
        setSelectedFile(null);
        setShowCropTools(false);
        setUploadProgress(0);
        setCropState({ x: 0, y: 0, scale: 100 });
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Clear selection
  const handleClear = () => {
    setSelectedFile(null);
    setShowCropTools(false);
    setUploadProgress(0);
    setCropState({ x: 0, y: 0, scale: 100 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const containerHeight = Math.floor((400 / aspectRatio) * 10) / 10;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!showCropTools ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
            isDragging
              ? "border-sky-500 bg-sky-500/10"
              : disabled
                ? "border-zinc-600 bg-zinc-900/50 cursor-not-allowed opacity-60"
                : "border-zinc-700 bg-zinc-900/20 hover:border-zinc-600 hover:bg-zinc-900/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileInputChange}
            disabled={disabled}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-3">
            <ArrowUpTrayIcon
              className={`w-8 h-8 ${isDragging ? "text-sky-400" : "text-zinc-400"}`}
            />
            <div>
              <p className="text-sm font-medium text-zinc-100">
                Drag and drop your image here
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                or click to select a file
              </p>
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              Max 5MB • jpg, png, webp, gif
            </p>
          </div>
        </div>
      ) : null}

      {/* Crop Preview */}
      {showCropTools && preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-100">
              Adjust & Preview
            </h3>
            <button
              onClick={handleClear}
              disabled={isUploading}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XMarkIcon className="w-3 h-3" />
              Clear
            </button>
          </div>

          {/* Preview Image */}
          <div
            className="relative w-full bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700"
            style={{ aspectRatio: aspectRatio }}
          >
            <img
              ref={imageRef}
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
              style={{
                transform: `scale(${cropState.scale / 100}) translateX(${cropState.x}%) translateY(${cropState.y}%)`,
              }}
            />
          </div>

          {/* Crop Controls */}
          <div className="space-y-3 bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-zinc-400">
                  Zoom ({Math.round(cropState.scale)}%)
                </label>
              </div>
              <input
                type="range"
                min="100"
                max="300"
                value={cropState.scale}
                onChange={(e) =>
                  handleCropChange("scale", parseInt(e.target.value))
                }
                disabled={isUploading}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-zinc-400">
                  Horizontal
                </label>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={cropState.x}
                onChange={(e) =>
                  handleCropChange("x", parseInt(e.target.value))
                }
                disabled={isUploading}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-zinc-400">
                  Vertical
                </label>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={cropState.y}
                onChange={(e) =>
                  handleCropChange("y", parseInt(e.target.value))
                }
                disabled={isUploading}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Aspect Ratio Info */}
            <div className="pt-2 border-t border-zinc-700">
              <p className="text-xs text-zinc-500">
                Aspect ratio locked to {aspectRatio.toFixed(2)}:1 (
                {aspectRatio > 1 ? `${Math.round(aspectRatio)}:1` : `1:${Math.round(1 / aspectRatio)}`})
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs font-medium text-zinc-300">Uploading...</p>
                <p className="text-xs text-zinc-500">{Math.round(uploadProgress)}%</p>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={performCropAndUpload}
              disabled={isUploading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : "Upload Image"}
            </button>
            <button
              onClick={handleClear}
              disabled={isUploading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current Image Display */}
      {!showCropTools && currentImage && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-400">Current Image</p>
          <div
            className="relative w-full bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700"
            style={{ aspectRatio: aspectRatio }}
          >
            <img
              src={currentImage}
              alt="Current portfolio image"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Hidden Canvas for cropping */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
