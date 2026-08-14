"use client";

import { useState } from "react";
import { EyeIcon, EyeSlashIcon, CheckIcon } from "@heroicons/react/24/outline";
import SettingsField, { INPUT_CLASS } from "./SettingsField";
import SettingsSection from "./SettingsSection";

export interface WebhookFormData {
  url: string;
  events: string[];
  active: boolean;
  secretKey: string;
}

export interface WebhookFormProps {
  initialData?: WebhookFormData;
  onSubmit: (data: WebhookFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

const WEBHOOK_EVENTS = [
  { id: "project.created", label: "Project Created", group: "Projects" },
  { id: "project.updated", label: "Project Updated", group: "Projects" },
  { id: "project.deleted", label: "Project Deleted", group: "Projects" },
  { id: "post.published", label: "Post Published", group: "Posts" },
  { id: "post.updated", label: "Post Updated", group: "Posts" },
  { id: "badge.earned", label: "Badge Earned", group: "Badges" },
  { id: "follower.added", label: "Follower Added", group: "Followers" },
];

function generateSecretKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "sk_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function WebhookForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
}: WebhookFormProps) {
  const [formData, setFormData] = useState<WebhookFormData>(
    initialData || {
      url: "",
      events: [],
      active: true,
      secretKey: generateSecretKey(),
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.url.trim()) {
      newErrors.url = "Webhook URL is required";
    } else if (!validateUrl(formData.url)) {
      newErrors.url = "Please enter a valid URL";
    }

    if (formData.events.length === 0) {
      newErrors.events = "Please select at least one event";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  const handleEventToggle = (eventId: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(formData.secretKey);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      console.error("Failed to copy secret key");
    }
  };

  const handleRegenerateSecret = () => {
    setFormData((prev) => ({
      ...prev,
      secretKey: generateSecretKey(),
    }));
  };

  // Group events by category
  const groupedEvents = WEBHOOK_EVENTS.reduce(
    (acc, event) => {
      if (!acc[event.group]) {
        acc[event.group] = [];
      }
      acc[event.group].push(event);
      return acc;
    },
    {} as Record<string, typeof WEBHOOK_EVENTS>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* URL Section */}
      <SettingsSection
        title="Webhook URL"
        description="Where we'll send webhook events"
      >
        <SettingsField
          label="Endpoint URL"
          hint="Must be a valid HTTPS URL"
          error={errors.url}
          required
        >
          <input
            type="url"
            value={formData.url}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, url: e.target.value }));
              if (errors.url) setErrors((prev) => ({ ...prev, url: "" }));
            }}
            placeholder="https://example.com/webhooks/logout"
            className={INPUT_CLASS}
            disabled={isLoading}
          />
        </SettingsField>
      </SettingsSection>

      {/* Secret Key Section */}
      <SettingsSection
        title="Secret Key"
        description="Use this to verify webhook authenticity"
      >
        <SettingsField label="Secret Key" hint="Keep this secure and never share it">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showSecret ? "text" : "password"}
                value={formData.secretKey}
                readOnly
                className={`${INPUT_CLASS} font-mono text-xs`}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showSecret ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleCopySecret}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              disabled={isLoading}
            >
              {copiedSecret ? (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                "Copy"
              )}
            </button>
          </div>
        </SettingsField>

        <button
          type="button"
          onClick={handleRegenerateSecret}
          className="text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
          disabled={isLoading}
        >
          ↻ Regenerate Secret Key
        </button>
      </SettingsSection>

      {/* Events Section */}
      <SettingsSection
        title="Events"
        description="Select which events should trigger this webhook"
      >
        <div className="space-y-4">
          {Object.entries(groupedEvents).map(([group, events]) => (
            <div key={group}>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
                {group}
              </h4>
              <div className="space-y-2">
                {events.map((event) => (
                  <label
                    key={event.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.id)}
                      onChange={() => {
                        handleEventToggle(event.id);
                        if (errors.events) {
                          setErrors((prev) => ({ ...prev, events: "" }));
                        }
                      }}
                      disabled={isLoading}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm text-white">{event.label}</span>
                      <span className="text-xs text-zinc-600 ml-2">{event.id}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        {errors.events && (
          <p className="text-xs text-rose-400 flex items-center gap-1 mt-3">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {errors.events}
          </p>
        )}
      </SettingsSection>

      {/* Status Section */}
      <SettingsSection title="Status">
        <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={formData.active}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, active: e.target.checked }))
            }
            disabled={isLoading}
            className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-0 cursor-pointer"
          />
          <div className="flex-1">
            <span className="text-sm text-white">Active</span>
            <span className="text-xs text-zinc-600">
              {formData.active
                ? "This webhook is active"
                : "This webhook is disabled"}
            </span>
          </div>
        </label>
      </SettingsSection>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Update Webhook"
          ) : (
            "Create Webhook"
          )}
        </button>
      </div>
    </form>
  );
}
