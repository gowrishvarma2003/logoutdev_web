"use client";

/**
 * PortfolioItem — Individual portfolio card component
 * Displays a single portfolio project with image, title, description, tags, and action links
 * Features: 16:9 aspect ratio, gradient fallback, hover effects, and action buttons
 */

import { LinkExternalIcon, CodeIcon } from "@primer/octicons-react";
import Image from "next/image";
import { useState } from "react";

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  demo_url?: string;
  repo_url?: string;
  tags?: string[];
}

interface PortfolioItemProps {
  item: PortfolioItem;
  onExpand?: (item: PortfolioItem) => void;
}

/**
 * Tag color mapping for consistent badge styling
 */
const TAG_COLORS = [
  "bg-sky-500/20 text-sky-300 border-sky-600/30",
  "bg-violet-500/20 text-violet-300 border-violet-600/30",
  "bg-emerald-500/20 text-emerald-300 border-emerald-600/30",
  "bg-amber-500/20 text-amber-300 border-amber-600/30",
  "bg-rose-500/20 text-rose-300 border-rose-600/30",
  "bg-cyan-500/20 text-cyan-300 border-cyan-600/30",
];

/**
 * Get tag color based on index
 */
function getTagColor(index: number): string {
  return TAG_COLORS[index % TAG_COLORS.length];
}

/**
 * Generate gradient fallback colors based on item ID
 */
function getGradientFallback(id: string): string {
  const hash = id.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  const gradients = [
    "from-zinc-800 to-zinc-900",
    "from-slate-800 to-slate-900",
    "from-stone-800 to-stone-900",
    "from-zinc-700 to-zinc-800",
  ];

  return gradients[hash % gradients.length];
}

export default function PortfolioItemCard({
  item,
  onExpand,
}: PortfolioItemProps) {
  const [imageError, setImageError] = useState(false);
  const gradientFallback = getGradientFallback(item.id);
  const hasLinks = item.demo_url || item.repo_url;

  return (
    <div
      className="group h-full flex flex-col rounded-lg border border-zinc-700/40 bg-zinc-900/40 overflow-hidden transition-all duration-300 hover:border-zinc-600/60 hover:bg-zinc-900/60 hover:shadow-lg hover:shadow-zinc-900/50 hover:-translate-y-1 cursor-pointer"
      onClick={() => onExpand?.(item)}
    >
      {/* Image Container - 16:9 aspect ratio */}
      <div className="relative w-full aspect-video bg-gradient-to-br overflow-hidden">
        {/* Gradient fallback */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradientFallback} transition-opacity duration-300 ${
            imageError || !item.image_url ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Image */}
        {item.image_url && !imageError && (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          {hasLinks && (
            <div className="flex gap-3">
              {item.demo_url && (
                <a
                  href={item.demo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-sky-600 hover:bg-sky-500 text-white transition-all duration-200 hover:scale-110 shadow-lg"
                  title="View Demo"
                >
                  <LinkExternalIcon size={16} />
                </a>
              )}
              {item.repo_url && (
                <a
                  href={item.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 text-white transition-all duration-200 hover:scale-110 shadow-lg"
                  title="View Repository"
                >
                  <CodeIcon size={16} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Container */}
      <div className="flex flex-col flex-1 p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-semibold text-zinc-100 group-hover:text-white transition-colors duration-200 line-clamp-2">
            {item.title}
          </h3>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors duration-200 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.slice(0, 3).map((tag, index) => (
              <span
                key={`${item.id}-tag-${index}`}
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border transition-all duration-200 ${getTagColor(index)}`}
              >
                {tag}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-zinc-500 bg-zinc-800/40">
                +{item.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Action Links */}
        {hasLinks && (
          <div className="flex gap-2 pt-2 mt-auto">
            {item.demo_url && (
              <a
                href={item.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-sky-300 bg-sky-600/15 border border-sky-600/30 hover:bg-sky-600/25 hover:border-sky-600/50 transition-all duration-200"
              >
                <LinkExternalIcon size={12} />
                <span>Demo</span>
              </a>
            )}
            {item.repo_url && (
              <a
                href={item.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-violet-300 bg-violet-600/15 border border-violet-600/30 hover:bg-violet-600/25 hover:border-violet-600/50 transition-all duration-200"
              >
                <CodeIcon size={12} />
                <span>Code</span>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
