"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CompassIcon,
  UserIcon,
  BellIcon,
  SparklesIcon,
  RocketIcon,
  QuestionMarkCircleIcon,
  BoltIcon,
  CodeBracketIcon,
  DotsIcon,
  XIcon,
  ChatBubbleIcon,
  LogOutIcon,
  KeyIcon,
} from "@/components/ui/Icons";

interface MobileNavProps {
  userId: string;
  username?: string;
  unreadCount?: number;
  onLogout: () => void;
}

export default function MobileNav({ userId, username, unreadCount = 0, onLogout }: MobileNavProps) {
  const pathname = usePathname();
  const profileSlug = username || userId;
  const [showMore, setShowMore] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  /* Primary items always visible in the bottom bar (max 5) */
  const primaryItems = [
    { href: "/feed", icon: <HomeIcon className="w-6 h-6" />, label: "Home" },
    { href: "/explore", icon: <CompassIcon className="w-6 h-6" />, label: "Explore" },
    { href: "/notifications", icon: <BellIcon className="w-6 h-6" />, label: "Inbox", badge: unreadCount },
    { href: "/spaces", icon: <RocketIcon className="w-6 h-6" />, label: "Spaces" },
    { href: `/profile/${profileSlug}`, icon: <UserIcon className="w-6 h-6" />, label: "Profile" },
  ];

  /* Secondary items shown in overflow "More" menu */
  const moreItems = [
    { href: "/launches", icon: <SparklesIcon className="w-5 h-5" />, label: "Launches" },
    { href: "/chat", icon: <ChatBubbleIcon className="w-5 h-5" />, label: "Chat" },
    { href: "/freelance", icon: <BoltIcon className="w-5 h-5" />, label: "Freelance" },
    { href: "/questions", icon: <QuestionMarkCircleIcon className="w-5 h-5" />, label: "Questions" },
    { href: "/repos", icon: <CodeBracketIcon className="w-5 h-5" />, label: "Repos" },
    { href: "/settings/tokens", icon: <KeyIcon className="w-5 h-5" />, label: "Git Tokens" },
  ];

  function isActive(href: string, label: string) {
    if (label === "Profile") return pathname.startsWith("/profile/");
    if (label === "Inbox") return pathname.startsWith("/notifications");
    if (label === "Spaces") return pathname.startsWith("/spaces");
    return pathname === href;
  }

  return (
    <>
      {/* ── Overflow menu drawn on top of content ── */}
      {showMore && (
        <>
          <div className="lg:hidden fixed inset-0 z-40 cursor-pointer bg-black/60 backdrop-blur-sm" onClick={() => setShowMore(false)} />
          <div className="lg:hidden fixed bottom-[61px] inset-x-0 z-50 animate-in slide-in-from-bottom-2 duration-150">
            <div className="mx-4 mb-2 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                <span className="text-sm font-semibold text-white">More</span>
                <button onClick={() => setShowMore(false)} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <nav className="grid grid-cols-2 gap-1 p-2">
                {moreItems.map(({ href, icon, label }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setShowMore(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                        active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
                      }`}
                    >
                      {icon}
                      {label}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-zinc-800 px-2 py-2">
                <button
                  onClick={() => {
                    setShowMore(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOutIcon className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Sign Out Confirmation Modal ── */}
      {showLogoutConfirm && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 mb-4">
              <LogOutIcon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">Sign Out</h3>
            <p className="text-sm text-zinc-400 text-center mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Bottom navigation bar ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-zinc-950 border-t border-zinc-800">
        <ul className="flex items-center">
          {primaryItems.map(({ href, icon, label, badge }) => {
            const active = isActive(href, label);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={`flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                    active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <span className="relative inline-flex">
                    {icon}
                    {badge ? (
                      <span className="absolute -right-2 -top-1 inline-flex min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    ) : null}
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}

          {/* More button */}
          <li className="flex-1">
            <button
              onClick={() => setShowMore((prev) => !prev)}
              className={`flex w-full flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                showMore ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <DotsIcon className="w-6 h-6" />
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
