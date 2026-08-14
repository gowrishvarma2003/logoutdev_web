"use client";

import { memo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  UserIcon,
  CogIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import SettingsSearch from "./SettingsSearch";
import { SettingEntry } from "@/lib/constants/settingsIndex";

interface SettingsSidebarProps {
  onLogout?: () => void;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isSubItem?: boolean;
}

/**
 * NavItem component - memoized to prevent unnecessary re-renders
 */
const NavItem = memo(function NavItem({ href, icon, label, active, isSubItem }: NavItemProps) {
  return (
    <Link
      href={href}
      role="menuitem"
      aria-current={active ? "page" : undefined}
      aria-label={`${label}${active ? " (current page)" : ""}`}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 min-h-[44px]
        ${
          isSubItem ? "ml-4 pl-6" : ""
        }
        ${
          active
            ? "bg-zinc-800 text-white"
            : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white"
        }`}
    >
      <span className="inline-flex items-center" aria-hidden="true">{icon}</span>
      <span className="flex-1">{label}</span>
    </Link>
  );
});

export default memo(function SettingsSidebar({ onLogout }: SettingsSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");
  const isIntegrationActive =
    isActive("/settings/integrations") || isActive("/settings/tokens");

  const handleSettingSelect = (setting: SettingEntry) => {
    router.push(setting.path);
  };

  return (
    <nav 
      className="w-64 border-r border-zinc-800 bg-zinc-950"
      role="navigation"
      aria-label="Settings navigation"
    >
      <div className="p-4 space-y-4">
        {/* Settings Search */}
        <SettingsSearch 
          onSelect={handleSettingSelect}
          placeholder="Search settings..."
        />

        {/* Navigation Separator */}
        <div className="border-t border-zinc-800" aria-hidden="true"></div>

        {/* Profile */}
        <NavItem
          href="/settings/profile"
          icon={<UserIcon className="h-5 w-5" />}
          label="Profile"
          active={isActive("/settings/profile")}
        />

        {/* Security */}
        <NavItem
          href="/settings/security"
          icon={<CogIcon className="h-5 w-5" />}
          label="Security"
          active={isActive("/settings/security")}
        />

        {/* Integrations Section */}
        <div className="pt-2 space-y-1">
          <NavItem
            href="/settings/integrations"
            icon={<CogIcon className="h-5 w-5" />}
            label="Integrations"
            active={isIntegrationActive}
          />
          {/* Access Tokens as sub-item */}
          <NavItem
            href="/settings/tokens"
            icon={<KeyIcon className="h-5 w-5" />}
            label="Access Tokens"
            active={isActive("/settings/tokens")}
            isSubItem={true}
          />
        </div>

        {/* Advanced */}
        <NavItem
          href="/settings/advanced"
          icon={<CogIcon className="h-5 w-5" />}
          label="Advanced"
          active={isActive("/settings/advanced")}
        />
      </div>
    </nav>
  );
});
