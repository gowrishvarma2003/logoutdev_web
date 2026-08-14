"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export interface BadgeData {
  id?: string;
  name: string;
  emoji: string;
  description: string;
}

interface BadgeEarnedToastProps {
  badge: BadgeData;
  onClose: () => void;
  autoCloseDuration?: number;
}

const animationStyles = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  @keyframes sparkle {
    0%, 100% {
      opacity: 0;
      transform: scale(0) rotate(0deg);
    }
    50% {
      opacity: 1;
      transform: scale(1) rotate(180deg);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }

  @keyframes progressWidth {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }

  .badge-toast {
    animation: slideIn 0.3s ease-out forwards;
  }

  .badge-toast.exiting {
    animation: slideOut 0.3s ease-out forwards;
  }

  .badge-emoji {
    animation: float 2s ease-in-out infinite, pulse 1.5s ease-in-out infinite;
  }

  .sparkle {
    position: absolute;
    pointer-events: none;
  }

  .sparkle-item {
    animation: sparkle 0.8s ease-out forwards;
  }

  .progress-bar {
    animation: progressWidth linear;
  }
`;

export default function BadgeEarnedToast({
  badge,
  onClose,
  autoCloseDuration = 5000,
}: BadgeEarnedToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 300);
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [autoCloseDuration, onClose]);

  if (!isVisible) {
    return null;
  }

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  return (
    <>
      <style>{animationStyles}</style>

      <div
        className={`badge-toast fixed bottom-4 right-4 z-50 max-w-sm ${
          isExiting ? "exiting" : ""
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="relative bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg shadow-lg border border-purple-500/30 overflow-hidden">
          {/* Sparkle container */}
          <div className="sparkle absolute inset-0 pointer-events-none">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="sparkle-item absolute text-yellow-300 text-lg"
                style={{
                  left: `${25 + i * 25}%`,
                  top: "10%",
                  animationDelay: `${i * 0.15}s`,
                }}
              >
                ✨
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="relative p-6 flex gap-4">
            {/* Badge emoji */}
            <div className="badge-emoji text-5xl flex-shrink-0 flex items-center justify-center">
              {badge.emoji}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white mb-1">Badge Earned!</h3>
              <p className="text-purple-100 font-semibold text-sm mb-1">
                {badge.name}
              </p>
              <p className="text-purple-200 text-xs leading-relaxed">
                {badge.description}
              </p>

              {/* Action button */}
              <div className="mt-3">
                <Link
                  href="/achievements"
                  className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                >
                  View Badge →
                </Link>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 text-purple-300 hover:text-white transition-colors p-1"
              aria-label="Close notification"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-900/50">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 progress-bar"
              style={{
                animationDuration: `${autoCloseDuration}ms`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
