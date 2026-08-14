/**
 * Settings Index - Searchable index of all available settings
 * Used for the settings search functionality
 */

export interface SettingEntry {
  id: string;
  name: string;
  category: string;
  description: string;
  path: string;
  keywords: string[];
}

export const SETTINGS_INDEX: SettingEntry[] = [
  // Profile Settings
  {
    id: "profile-photo",
    name: "Profile Photo",
    category: "Profile",
    description: "Upload and manage your profile picture",
    path: "/settings/profile",
    keywords: ["avatar", "photo", "picture", "image", "profile picture"],
  },
  {
    id: "full-name",
    name: "Full Name",
    category: "Profile",
    description: "Update your full name",
    path: "/settings/profile",
    keywords: ["name", "full name", "display name"],
  },
  {
    id: "bio",
    name: "Bio",
    category: "Profile",
    description: "Add a short bio about yourself",
    path: "/settings/profile",
    keywords: ["bio", "about", "description", "profile bio"],
  },
  {
    id: "location",
    name: "Location",
    category: "Profile",
    description: "Set your location",
    path: "/settings/profile",
    keywords: ["location", "city", "country", "place"],
  },
  {
    id: "website",
    name: "Website",
    category: "Profile",
    description: "Add your personal website or portfolio",
    path: "/settings/profile",
    keywords: ["website", "url", "link", "homepage", "portfolio"],
  },

  // Account Settings
  {
    id: "email",
    name: "Email Address",
    category: "Account",
    description: "Manage your primary email address",
    path: "/settings/account",
    keywords: ["email", "mail", "email address", "contact email"],
  },
  {
    id: "username",
    name: "Username",
    category: "Account",
    description: "Change your unique username",
    path: "/settings/account",
    keywords: ["username", "handle", "user name"],
  },
  {
    id: "delete-account",
    name: "Delete Account",
    category: "Account",
    description: "Permanently delete your account and all data",
    path: "/settings/account",
    keywords: ["delete", "remove", "account deletion", "close account"],
  },

  // Security Settings
  {
    id: "password",
    name: "Change Password",
    category: "Security",
    description: "Update your login password",
    path: "/settings/security",
    keywords: ["password", "change password", "security", "login"],
  },
  {
    id: "two-factor",
    name: "Two-Factor Authentication",
    category: "Security",
    description: "Enable or disable two-factor authentication",
    path: "/settings/security",
    keywords: [
      "2fa",
      "two-factor",
      "authentication",
      "totp",
      "mfa",
      "authenticator",
    ],
  },
  {
    id: "login-history",
    name: "Login History",
    category: "Security",
    description: "View your recent login activity",
    path: "/settings/security",
    keywords: ["login", "history", "activity", "sessions"],
  },
  {
    id: "sessions",
    name: "Active Sessions",
    category: "Security",
    description: "Manage your active login sessions",
    path: "/settings/security",
    keywords: ["session", "sessions", "devices", "active sessions"],
  },

  // Access Tokens
  {
    id: "access-tokens",
    name: "Access Tokens",
    category: "Integrations",
    description: "Create and manage API access tokens",
    path: "/settings/tokens",
    keywords: ["token", "api", "access", "authentication", "api key"],
  },
  {
    id: "personal-tokens",
    name: "Personal Access Tokens",
    category: "Integrations",
    description: "Create tokens for personal use and scripting",
    path: "/settings/tokens",
    keywords: ["personal token", "pat", "token"],
  },

  // Integrations
  {
    id: "webhooks",
    name: "Webhooks",
    category: "Integrations",
    description: "Configure webhooks for external integrations",
    path: "/settings/integrations/webhooks",
    keywords: ["webhook", "integration", "event", "external"],
  },
  {
    id: "github-integration",
    name: "GitHub Integration",
    category: "Integrations",
    description: "Connect and manage GitHub integration",
    path: "/settings/integrations",
    keywords: ["github", "integration", "connected", "third-party"],
  },
  {
    id: "slack-integration",
    name: "Slack Integration",
    category: "Integrations",
    description: "Connect and manage Slack notifications",
    path: "/settings/integrations",
    keywords: ["slack", "integration", "notifications"],
  },

  // Advanced Settings
  {
    id: "advanced",
    name: "Advanced Settings",
    category: "Advanced",
    description: "Advanced configuration and developer options",
    path: "/settings/advanced",
    keywords: ["advanced", "developer", "experimental", "beta"],
  },
  {
    id: "api-docs",
    name: "API Documentation",
    category: "Advanced",
    description: "View API documentation and reference",
    path: "/settings/advanced",
    keywords: ["api", "documentation", "developer", "reference"],
  },
];

/**
 * Search settings by query
 * Matches against name, description, and keywords
 */
export function searchSettings(query: string): SettingEntry[] {
  if (!query.trim()) {
    return [];
  }

  const lowercaseQuery = query.toLowerCase();

  return SETTINGS_INDEX.filter((setting) => {
    // Check name
    if (setting.name.toLowerCase().includes(lowercaseQuery)) {
      return true;
    }

    // Check description
    if (setting.description.toLowerCase().includes(lowercaseQuery)) {
      return true;
    }

    // Check keywords
    if (
      setting.keywords.some((keyword) =>
        keyword.toLowerCase().includes(lowercaseQuery)
      )
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Get settings by category
 */
export function getSettingsByCategory(category: string): SettingEntry[] {
  return SETTINGS_INDEX.filter((setting) => setting.category === category);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(SETTINGS_INDEX.map((setting) => setting.category));
  return Array.from(categories).sort();
}
