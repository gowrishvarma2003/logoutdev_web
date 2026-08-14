/**
 * Settings Layout - Provides the settings sidebar for all settings pages
 * /settings/* pages will be wrapped with this layout
 * Includes skip links and proper landmark regions
 */

import SkipLinks from "@/components/ui/SkipLink";
import SettingsSidebar from "@/components/settings/SettingsSidebar";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="flex h-screen">
      {/* Skip Links */}
      <SkipLinks />

      {/* Settings Sidebar */}
      <SettingsSidebar />

      {/* Settings Content */}
      <main 
        className="flex-1 overflow-y-auto"
        id="main-content"
        role="main"
        aria-label="Settings"
      >
        <div className="max-w-5xl mx-auto">
          <div className="px-6 py-8 space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
