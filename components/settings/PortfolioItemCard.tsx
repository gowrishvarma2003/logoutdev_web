"use client";

/**
 * PortfolioItemCard — Compact card view for portfolio items in settings
 * Shows thumbnail, title, description, tech tags
 * Edit/Delete action buttons
 */

import { EditIcon, TrashIcon, ExternalLinkIcon } from "@/components/ui/Icons";
import type { PortfolioItemFormData } from "./PortfolioItemForm";

interface PortfolioItemCardProps {
  item: PortfolioItemFormData;
  onEdit: (item: PortfolioItemFormData) => void;
  onDelete: (id: string) => Promise<void> | void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isDeleting?: boolean;
}

export default function PortfolioItemCard({
  item,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  isDeleting = false,
}: PortfolioItemCardProps) {
  const handleDelete = async () => {
    if (!item.id) return;
    if (confirm("Are you sure you want to delete this portfolio item?")) {
      await onDelete(item.id);
    }
  };

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900/80 transition-colors group">
      {/* Thumbnail */}
      <div className="flex-shrink-0">
        <div className="w-32 h-32 rounded-lg bg-zinc-800 overflow-hidden flex items-center justify-center border border-zinc-700">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "";
                e.currentTarget.className = "hidden";
              }}
            />
          ) : (
            <div className="flex items-center justify-center text-zinc-600">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="text-sm font-semibold text-white truncate">
            {item.title}
          </h3>

          {/* Description */}
          <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
            {item.description}
          </p>

          {/* Technologies */}
          {item.technologies.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.technologies.slice(0, 4).map((tech) => (
                <span
                  key={tech}
                  className="inline-flex px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium"
                >
                  {tech}
                </span>
              ))}
              {item.technologies.length > 4 && (
                <span className="inline-flex px-2 py-0.5 text-zinc-500 text-xs">
                  +{item.technologies.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Links */}
          <div className="mt-2 flex gap-3">
            {item.demoUrl && (
              <a
                href={item.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                aria-label={`View demo of ${item.title}`}
              >
                Live Demo
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            )}
            {item.repoUrl && (
              <a
                href={item.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                aria-label={`View repository of ${item.title}`}
              >
                Repository
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex gap-2 pt-3 border-t border-zinc-800">
          <button
            onClick={() => onEdit(item)}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Edit ${item.title}`}
          >
            <EditIcon className="w-3.5 h-3.5" />
            Edit
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 bg-rose-950/30 hover:bg-rose-950/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Delete ${item.title}`}
          >
            <TrashIcon className="w-3.5 h-3.5" />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>

          {/* Reorder buttons */}
          {(onMoveUp || onMoveDown) && (
            <div className="ml-auto flex gap-1">
              {onMoveUp && (
                <button
                  onClick={onMoveUp}
                  disabled={!canMoveUp || isDeleting}
                  className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Move ${item.title} up`}
                  title="Move up"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.707 9.293a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L5.121 9.293a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
              {onMoveDown && (
                <button
                  onClick={onMoveDown}
                  disabled={!canMoveDown || isDeleting}
                  className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Move ${item.title} down`}
                  title="Move down"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.293 10.707a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l3.879-3.879a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
