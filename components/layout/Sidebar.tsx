"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  CogIcon,
  BoltIcon,
  SparklesIcon,
} from "@/components/ui/Icons";

interface SidebarProps {
  user: User;
  onLogout: () => void;
  unreadCount?: number;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
}

function NavItem({ href, icon, label, active, badge }: NavItemProps) {
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
          <span className="absolute -right-2 -top-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span className="flex-1">{label}</span>
    </Link>
  );
}

export default function Sidebar({ user, onLogout, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmed = query.trim();
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
    <nav className="flex flex-col h-full px-4 py-6">
      {/* Logo */}
      <Link href="/feed" className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
          <span className="text-zinc-950 font-bold text-xs">LD</span>
        </div>
        <span className="font-bold text-white text-[17px] tracking-tight">
          LogoutDev
        </span>
      </Link>

      <form onSubmit={handleSearchSubmit} className="mb-6 px-1">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search builders, launches, spaces..."
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-700"
        />
      </form>

      {/* Navigation items */}
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
          badge={unreadCount}
        />
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
          href={`/profile/${user.username || user.id}`}
          icon={<UserIcon />}
          label="Profile"
          active={pathname.startsWith("/profile/")}
        />
        <NavItem
          href="/settings/profile"
          icon={<CogIcon />}
          label="Settings"
          active={pathname.startsWith("/settings")}
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* User footer */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-zinc-800/60 transition-colors group">
        <Avatar user={user} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {user.name}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            @{emailToHandle(user.email)}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="text-zinc-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOutIcon className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
