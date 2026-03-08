"use client";

import type { LaunchScreenshot } from "@/lib/types";

export default function LaunchScreenshotGallery({ screenshots }: { screenshots: LaunchScreenshot[] }) {
  if (screenshots.length === 0) return null;

  const hasShowcaseShot = screenshots.length >= 3;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {screenshots.map((shot, index) => (
        <figure
          key={shot.id}
          className={`overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/60 ${
            hasShowcaseShot && index === 0 ? "sm:col-span-2" : ""
          }`}
        >
          <img
            src={shot.image_url}
            alt={shot.caption || "Launch screenshot"}
            className="h-full w-full object-cover"
            style={{ aspectRatio: hasShowcaseShot && index === 0 ? "16/8" : "16/10" }}
          />

          {shot.caption && (
            <figcaption className="border-t border-zinc-800/80 px-4 py-3 text-xs leading-relaxed text-zinc-500">
              {shot.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
