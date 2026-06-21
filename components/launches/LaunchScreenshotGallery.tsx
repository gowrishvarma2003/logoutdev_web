"use client";

import { useState } from "react";
import type { LaunchScreenshot } from "@/lib/types";
import { XIcon } from "@/components/ui/Icons";
import ExternalImage from "@/components/ui/ExternalImage";

export default function LaunchScreenshotGallery({ screenshots }: { screenshots: LaunchScreenshot[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (screenshots.length === 0) return null;

  return (
    <>
      {/* Horizontal scrollable gallery */}
      <div className="relative -mx-4 sm:-mx-6">
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 sm:px-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800 hover:scrollbar-thumb-zinc-700">
          {screenshots.map((shot, index) => (
            <div
              key={shot.id}
              className="group relative flex-shrink-0 flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/80 transition-all hover:border-zinc-700/80 w-[280px] sm:w-[380px]"
            >
              {/* Browser mockup header */}
              <div className="flex items-center gap-1.5 border-b border-zinc-900/60 bg-zinc-900/40 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/40" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
                </div>
                <div className="mx-auto flex h-5 w-44 items-center justify-center rounded-lg bg-zinc-950/60 px-2 text-[10px] text-zinc-500 font-mono select-none border border-zinc-900">
                  logoutdev.com/app
                </div>
              </div>

              {/* Screenshot button */}
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="relative block w-full overflow-hidden focus:outline-none bg-zinc-950"
              >
                <div className="aspect-[16/10] w-full overflow-hidden">
                  <ExternalImage
                    src={shot.image_url}
                    alt={shot.caption || `Screenshot ${index + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    fallbackClassName="h-full w-full bg-zinc-900"
                  />
                </div>
                {shot.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/50 to-transparent px-4 py-3">
                    <p className="truncate text-xs text-zinc-300 font-medium">{shot.caption}</p>
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 p-4 backdrop-blur-md"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-6 top-6 rounded-full bg-zinc-900/80 p-2.5 text-zinc-400 border border-zinc-800 transition-all hover:bg-zinc-800 hover:text-white"
            aria-label="Close lightbox"
          >
            <XIcon className="h-5 w-5" />
          </button>

          <div className="relative max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">
              {/* Lightbox Browser Bar */}
              <div className="flex items-center gap-1.5 border-b border-zinc-900 bg-zinc-900/60 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500/40" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/40" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/40" />
                </div>
                <div className="mx-auto flex h-6 w-60 items-center justify-center rounded-lg bg-zinc-950/60 px-3 text-xs text-zinc-500 font-mono border border-zinc-900 select-none">
                  logoutdev.com/beta-preview
                </div>
              </div>
              <ExternalImage
                src={screenshots[lightboxIndex].image_url}
                alt={screenshots[lightboxIndex].caption || `Screenshot ${lightboxIndex + 1}`}
                className="max-h-[70vh] max-w-[85vw] object-contain"
                fallbackClassName="h-[50vh] w-[50vw] bg-zinc-900"
              />
            </div>
            {screenshots[lightboxIndex].caption && (
              <p className="mt-4 text-center text-sm text-zinc-300 font-medium">
                {screenshots[lightboxIndex].caption}
              </p>
            )}

            {/* Navigation arrows */}
            {screenshots.length > 1 && (
              <div className="absolute inset-y-0 -left-16 -right-16 flex items-center justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((lightboxIndex - 1 + screenshots.length) % screenshots.length);
                  }}
                  className="pointer-events-auto rounded-full bg-zinc-900/80 p-3 text-zinc-400 border border-zinc-800 transition-all hover:bg-zinc-800 hover:text-white"
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
                  className="pointer-events-auto rounded-full bg-zinc-900/80 p-3 text-zinc-400 border border-zinc-800 transition-all hover:bg-zinc-800 hover:text-white"
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
              <div className="mt-5 flex justify-center gap-1.5">
                {screenshots.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(i);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === lightboxIndex ? "w-5 bg-white" : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
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
