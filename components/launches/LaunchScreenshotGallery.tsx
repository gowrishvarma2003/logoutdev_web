"use client";

import { useState } from "react";
import type { LaunchScreenshot } from "@/lib/types";
import { XIcon, SparklesIcon } from "@/components/ui/Icons";
import ExternalImage from "@/components/ui/ExternalImage";

export default function LaunchScreenshotGallery({ screenshots }: { screenshots: LaunchScreenshot[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (screenshots.length === 0) return null;

  return (
    <>
      {/* Horizontal scrollable gallery */}
      <div className="relative -mx-4 sm:-mx-6">
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700">
          {screenshots.map((shot, index) => (
            <button
              key={shot.id}
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="group relative flex-shrink-0 overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/60 transition-all hover:border-zinc-700"
            >
              <ExternalImage
                src={shot.image_url}
                alt={shot.caption || `Screenshot ${index + 1}`}
                className="h-40 w-auto max-w-[280px] object-cover transition-transform group-hover:scale-[1.02] sm:h-48 sm:max-w-[360px]"
                fallbackClassName="h-40 w-[200px] sm:h-48 sm:w-[280px]"
              />
              {shot.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                  <p className="truncate text-xs text-zinc-300">{shot.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-zinc-800/80 p-2 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
            aria-label="Close lightbox"
          >
            <XIcon className="h-5 w-5" />
          </button>

          <div className="relative max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <ExternalImage
              src={screenshots[lightboxIndex].image_url}
              alt={screenshots[lightboxIndex].caption || `Screenshot ${lightboxIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
              fallbackClassName="h-[50vh] w-[50vw]"
            />
            {screenshots[lightboxIndex].caption && (
              <p className="mt-3 text-center text-sm text-zinc-400">
                {screenshots[lightboxIndex].caption}
              </p>
            )}

            {/* Navigation arrows */}
            {screenshots.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((lightboxIndex - 1 + screenshots.length) % screenshots.length);
                  }}
                  className="pointer-events-auto -ml-12 rounded-full bg-zinc-800/80 p-2 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                  aria-label="Previous screenshot"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((lightboxIndex + 1) % screenshots.length);
                  }}
                  className="pointer-events-auto -mr-12 rounded-full bg-zinc-800/80 p-2 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
                  aria-label="Next screenshot"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Dots indicator */}
            {screenshots.length > 1 && (
              <div className="mt-4 flex justify-center gap-1.5">
                {screenshots.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(i);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === lightboxIndex ? "w-4 bg-white" : "w-1.5 bg-zinc-600 hover:bg-zinc-500"
                    }`}
                    aria-label={`Go to screenshot ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
