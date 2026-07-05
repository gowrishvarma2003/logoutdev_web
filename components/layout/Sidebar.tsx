"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { User } from "@/lib/types";
import { emailToHandle } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import {
  HomeIcon,
  BellIcon,
  CompassIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  LogOutIcon,
  PencilSquareIcon,
  RocketIcon,
  CodeBracketIcon,
  BoltIcon,
  SparklesIcon,
  ChatBubbleIcon,
  KeyIcon,
} from "@/components/ui/Icons";

interface SidebarProps {
  user: User;
  onLogout: () => void;
  unreadCount?: number;
  needsActionCount?: number;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  badgeTone?: "action" | "unread";
}

function NavItem({ href, icon, label, active, badge, badgeTone = "unread" }: NavItemProps) {
  const badgeClass = badgeTone === "action" ? "bg-amber-400 text-zinc-950" : "bg-rose-500 text-white";

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
        ${
          active
            ? "bg-zinc-800 text-white"
            : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
        }`}
    >
      <span className="relative inline-flex items-center">
        {icon}
        {badge ? (
          <span className={`absolute -right-2 -top-2 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${badgeClass}`}>
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span className="flex-1">{label}</span>
    </Link>
  );
}

export default function Sidebar({ user, onLogout, unreadCount = 0, needsActionCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const placeholders = ["builders", "launches", "spaces", "questions", "repos"];
  const inboxBadge = needsActionCount || unreadCount;
  const inboxBadgeTone = needsActionCount ? "action" : "unread";
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const q = searchParams.get("q") || "";
  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setIsFading(false);
      }, 300);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    const formData = new FormData(event.currentTarget);
    const trimmed = String(formData.get("q") || "").trim();
    if (trimmed) {
      params.set("q", trimmed);
    }

    if (pathname === "/explore") {
      ["type", "stack", "tag", "status", "collab", "sort"].forEach((key) => {
        const value = searchParams.get(key);
        if (value) params.set(key, value);
      });
    }

    router.push(params.toString() ? `/explore?${params.toString()}` : "/explore");
  }

  return (
    <>
      <nav className="flex flex-col h-full px-4 py-6">
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-2.5 px-3 mb-8">
        <img src="/logo.jpeg" alt="LogoutDev" className="h-8 w-8 rounded-full object-cover" />
      </Link>

      <form onSubmit={handleSearchSubmit} className="mb-6 px-1">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            key={`${pathname}:${searchParams.toString()}`}
            name="q"
            aria-label="Search"
            defaultValue={searchParams.get("q") || ""}
            onChange={(e) => setSearchValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-colors focus:border-zinc-700"
          />
          {!searchValue && !isFocused && (
            <div className="absolute left-9 top-1/2 -translate-y-1/2 pointer-events-none text-sm text-zinc-500 flex items-center gap-1">
              <span>Search</span>
              <span
                className={`inline-block transition-all duration-300 ${
                  isFading ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0"
                }`}
              >
                {placeholders[placeholderIndex]}
              </span>
            </div>
          )}
        </div>
      </form>

      {/* Main navigation */}
      <div className="flex flex-col gap-1">
        <NavItem
          href="/feed"
          icon={<HomeIcon />}
          label="Home"
          active={pathname === "/feed"}
        />
        <NavItem
          href="/explore"
          icon={<CompassIcon />}
          label="Explore"
          active={pathname === "/explore"}
        />
        <NavItem
          href="/notifications"
          icon={<BellIcon />}
          label="Inbox"
          active={pathname.startsWith("/notifications")}
          badge={inboxBadge}
          badgeTone={inboxBadgeTone}
        />
        <NavItem
          href="/chat"
          icon={<ChatBubbleIcon />}
          label="Chat"
          active={pathname.startsWith("/chat")}
        />
      </div>

      {/* Build section */}
      <div className="my-1 mx-3 border-t border-zinc-800/60" />
      <div className="flex flex-col gap-1">
        <NavItem
          href="/launches"
          icon={<SparklesIcon />}
          label="Launches"
          active={pathname.startsWith("/launches")}
        />
        <NavItem
          href="/freelance"
          icon={<BoltIcon />}
          label="Freelance"
          active={pathname.startsWith("/freelance")}
        />
        <NavItem
          href="/questions"
          icon={<QuestionMarkCircleIcon />}
          label="Questions"
          active={pathname.startsWith("/questions")}
        />
        <NavItem
          href="/spaces"
          icon={<RocketIcon />}
          label="Spaces"
          active={pathname.startsWith("/spaces")}
        />
        <NavItem
          href="/repos"
          icon={<CodeBracketIcon className="w-5 h-5" />}
          label="Repos"
          active={pathname.startsWith("/repos")}
        />
      </div>

      {/* Compose CTA */}
      <Link
        href="/feed"
        className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white text-zinc-950 text-sm font-semibold hover:bg-zinc-100 transition-colors"
      >
        <PencilSquareIcon className="w-4 h-4" />
        New Post
      </Link>

      <div className="mt-4 flex flex-col gap-1">
        <NavItem
          href="/settings/tokens"
          icon={<KeyIcon className="w-5 h-5" />}
          label="Git Tokens"
          active={pathname.startsWith("/settings/tokens")}
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User footer */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 transition-colors group">
        <Link
          href={`/profile/${user.username || user.id}`}
          className="flex flex-1 items-center gap-2.5 min-w-0"
        >
          <Avatar user={user} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user.name}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              @{user.username || emailToHandle(user.email)}
            </p>
          </div>
        </Link>
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="p-1.5 rounded-full hover:bg-rose-600/35 text-zinc-500 hover:text-rose-400 cursor-pointer transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOutIcon className="w-4 h-4" />
        </button>
      </div>
    </nav>

      {/* Logout Confirmation Modal — portaled to body so it's never clipped by sidebar overflow */}
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
    </>
  );
}
