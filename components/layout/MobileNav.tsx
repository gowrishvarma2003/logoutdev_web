"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  CompassIcon,
  UserIcon,
  RocketIcon,
  QuestionMarkCircleIcon,
  BoltIcon,
  BellIcon,
  CodeBracketIcon,
} from "@/components/ui/Icons";

interface MobileNavProps {
  /** username or fallback user ID for the profile link */
  userId: string;
  username?: string;
  unreadCount?: number;
}

export default function MobileNav({ userId, username, unreadCount = 0 }: MobileNavProps) {
  const pathname = usePathname();
  const profileSlug = username || userId;

  const items = [
    { href: "/feed", icon: <HomeIcon className="w-6 h-6" />, label: "Home" },
    { href: "/explore", icon: <CompassIcon className="w-6 h-6" />, label: "Explore" },
    { href: "/notifications", icon: <BellIcon className="w-6 h-6" />, label: "Inbox", badge: unreadCount },
    { href: "/freelance", icon: <BoltIcon className="w-6 h-6" />, label: "Freelance" },
    { href: "/questions", icon: <QuestionMarkCircleIcon className="w-6 h-6" />, label: "Questions" },
    { href: "/spaces", icon: <RocketIcon className="w-6 h-6" />, label: "Spaces" },
    { href: "/repos", icon: <CodeBracketIcon className="w-6 h-6" />, label: "Repos" },
    { href: `/profile/${profileSlug}`, icon: <UserIcon className="w-6 h-6" />, label: "Profile" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-zinc-950 border-t border-zinc-800">
      <ul className="flex items-center">
        {items.map(({ href, icon, label, badge }) => {
          const active =
            label === "Profile"
              ? pathname.startsWith("/profile/")
              : label === "Inbox"
                ? pathname.startsWith("/notifications")
              : label === "Freelance"
                ? pathname.startsWith("/freelance")
              : label === "Repos"
                ? pathname.startsWith("/repos")
                : pathname === href;

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
      </ul>
    </nav>
  );
}
