"use client";

/**
 * PortfolioShowcase — Grid-based portfolio display component
 * Shows a collection of portfolio items in a responsive grid layout
 * Features: 2-3 column grid, empty state, detail modal, and add CTA for own profile
 */

import { useState } from "react";
import PortfolioItemCard, {
  PortfolioItem,
} from "./PortfolioItem";
import { PlusIcon, XIcon } from "@primer/octicons-react";

interface PortfolioShowcaseProps {
  items: PortfolioItem[];
  showEmpty?: boolean;
  isOwnProfile?: boolean;
  onAddPortfolioItem?: () => void;
}

interface PortfolioDetailModalProps {
  item: PortfolioItem;
  onClose: () => void;
}

/**
 * Detail modal component for expanded portfolio item view
 */
function PortfolioDetailModal({ item, onClose }: PortfolioDetailModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-zinc-900 rounded-lg border border-zinc-700/60 shadow-2xl shadow-black/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-700/40 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-semibold text-zinc-100 truncate">
              {item.title}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 hover:bg-zinc-800/50 rounded"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Image */}
            {item.image_url && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/40">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Description */}
            {item.description && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">
                  About this project
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                  Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={`detail-tag-${index}`}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                        [
                          "bg-sky-500/20 text-sky-300 border-sky-600/30 hover:bg-sky-500/30",
                          "bg-violet-500/20 text-violet-300 border-violet-600/30 hover:bg-violet-500/30",
                          "bg-emerald-500/20 text-emerald-300 border-emerald-600/30 hover:bg-emerald-500/30",
                          "bg-amber-500/20 text-amber-300 border-amber-600/30 hover:bg-amber-500/30",
                          "bg-rose-500/20 text-rose-300 border-rose-600/30 hover:bg-rose-500/30",
                          "bg-cyan-500/20 text-cyan-300 border-cyan-600/30 hover:bg-cyan-500/30",
                        ][index % 6]
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Links */}
            {(item.demo_url || item.repo_url) && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                  Links
                </h3>
                <div className="flex flex-col gap-2">
                  {item.demo_url && (
                    <a
                      href={item.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-sky-300 bg-sky-600/15 border border-sky-600/30 hover:bg-sky-600/25 hover:border-sky-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-sky-600/10"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      View Live Demo
                    </a>
                  )}
                  {item.repo_url && (
                    <a
                      href={item.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-violet-300 bg-violet-600/15 border border-violet-600/30 hover:bg-violet-600/25 hover:border-violet-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-violet-600/10"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      View Repository
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * PortfolioShowcase component
 */
export default function PortfolioShowcase({
  items,
  showEmpty = true,
  isOwnProfile = false,
  onAddPortfolioItem,
}: PortfolioShowcaseProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  // Empty state
  if (items.length === 0 && showEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg border border-zinc-700/40 bg-zinc-900/20">
        <div className="text-5xl mb-3 opacity-30">🎨</div>
        <p className="text-zinc-300 text-sm font-medium">No portfolio items yet</p>
        <p className="text-zinc-500 text-xs mt-1">
          {isOwnProfile
            ? "Showcase your projects and achievements"
            : "This user hasn't added any portfolio items yet"}
        </p>
        {isOwnProfile && onAddPortfolioItem && (
          <button
            onClick={onAddPortfolioItem}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-sky-300 bg-sky-600/15 border border-sky-600/30 hover:bg-sky-600/25 hover:border-sky-600/50 transition-all duration-200"
          >
            <PlusIcon size={16} />
            Add Portfolio Item
          </button>
        )}
      </div>
    );
  }

  // Hide component if no items and showEmpty is false
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {/* Grid Container */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Portfolio Items */}
          {items.map((item) => (
            <PortfolioItemCard
              key={item.id}
              item={item}
              onExpand={setSelectedItem}
            />
          ))}

          {/* Add Portfolio Item CTA - Only for own profile */}
          {isOwnProfile && onAddPortfolioItem && (
            <button
              onClick={onAddPortfolioItem}
              className="h-full min-h-[280px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-600/40 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-600/60 transition-all duration-300 group cursor-pointer"
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">
                <PlusIcon size={32} className="text-zinc-500 group-hover:text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300">
                Add Portfolio Item
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Showcase your latest projects
              </p>
            </button>
          )}
        </div>

        {/* Info text */}
        {items.length > 0 && (
          <p className="text-xs text-zinc-500 text-center">
            Showing {items.length} portfolio {items.length === 1 ? "item" : "items"}
          </p>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <PortfolioDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
