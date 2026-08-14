"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, PlusIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import WebhookCard, { Webhook } from "@/components/settings/WebhookCard";
import WebhookForm, { WebhookFormData } from "@/components/settings/WebhookForm";
import SettingsSection from "@/components/settings/SettingsSection";

type View = "list" | "create" | "edit";

// Mock data for webhooks
const MOCK_WEBHOOKS: Webhook[] = [
  {
    id: "wh_1a2b3c4d5e6f",
    url: "https://api.example.com/webhooks/logout-events",
    events: ["project.created", "project.updated", "post.published"],
    active: true,
    secretKey: "sk_test_abcdef1234567890",
    status: "active",
    createdAt: new Date("2024-03-15"),
    lastTriggeredAt: new Date("2024-03-20T14:32:00"),
  },
  {
    id: "wh_9x8y7z6w5v4u",
    url: "https://webhook.site/unique-id-123",
    events: ["badge.earned", "follower.added"],
    active: true,
    secretKey: "sk_test_xyz9876543210",
    status: "active",
    createdAt: new Date("2024-03-10"),
    lastTriggeredAt: new Date("2024-03-20T10:15:00"),
  },
  {
    id: "wh_3q2w1e9r8t7y",
    url: "https://my-service.com/events/logout",
    events: ["project.deleted", "post.updated"],
    active: false,
    secretKey: "sk_test_disabled123",
    status: "disabled",
    createdAt: new Date("2024-02-28"),
    lastTriggeredAt: undefined,
  },
];

export default function WebhooksPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("list");
  const [webhooks, setWebhooks] = useState<Webhook[]>(MOCK_WEBHOOKS);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testLoadingId, setTestLoadingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleCreateClick = () => {
    setEditingWebhook(null);
    setView("create");
  };

  const handleEditClick = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setView("edit");
  };

  const handleDeleteClick = (webhookId: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
    showSuccessMessage("Webhook deleted successfully");
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTestLoadingId(webhookId);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showSuccessMessage("Webhook test sent successfully");
    } catch (error) {
      console.error("Failed to test webhook:", error);
    } finally {
      setTestLoadingId(null);
    }
  };

  const handleFormSubmit = async (data: WebhookFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (editingWebhook) {
        // Update webhook
        setWebhooks((prev) =>
          prev.map((w) =>
            w.id === editingWebhook.id
              ? {
                  ...w,
                  ...data,
                  status: data.active ? "active" : "disabled",
                }
              : w
          )
        );
        showSuccessMessage("Webhook updated successfully");
      } else {
        // Create new webhook
        const newWebhook: Webhook = {
          id: `wh_${Math.random().toString(36).substr(2, 12)}`,
          ...data,
          status: data.active ? "active" : "disabled",
          createdAt: new Date(),
        };
        setWebhooks((prev) => [newWebhook, ...prev]);
        showSuccessMessage("Webhook created successfully");
      }

      setView("list");
      setEditingWebhook(null);
    } catch (error) {
      console.error("Failed to save webhook:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setView("list");
    setEditingWebhook(null);
  };

  return (
    <div>
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/settings/integrations")}
              className="p-1.5 -ml-1.5 rounded-full text-zinc-400 hover:bg-zinc-800 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">Settings</span>
              <span className="text-zinc-600">/</span>
              <span className="text-sm text-zinc-500">Integrations</span>
              <span className="text-zinc-600">/</span>
              <h1 className="text-[15px] font-bold text-white">Webhooks</h1>
            </div>
          </div>

          {view === "list" && (
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Add Webhook
            </button>
          )}
        </div>
      </header>

      {/* ── Success Message ── */}
      {successMessage && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-green-900/30 border border-green-900/50 text-green-400 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {successMessage}
        </div>
      )}

      {/* ── Content ── */}
      <div className="px-5 py-6 max-w-3xl">
        {view === "list" ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Webhooks</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Send real-time events to external services when something happens in your LogoutDev account.
              </p>
            </div>

            {/* Info Banner */}
            <SettingsSection
              title="How Webhooks Work"
              icon={<ExclamationCircleIcon className="w-5 h-5" />}
            >
              <p className="text-sm text-zinc-300">
                Webhooks are HTTP POST requests sent to your specified URL whenever events occur. Each request includes:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Event type and payload in JSON format</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>HMAC-SHA256 signature for security verification</span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>Unique webhook ID and timestamp</span>
                </li>
              </ul>
            </SettingsSection>

            {/* Webhooks List */}
            <div className="mt-8">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Configured Webhooks ({webhooks.length})
                </h3>
              </div>

              {webhooks.length > 0 ? (
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <WebhookCard
                      key={webhook.id}
                      webhook={webhook}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                      onTest={handleTestWebhook}
                      isTestLoading={testLoadingId !== null}
                      testLoadingId={testLoadingId || undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
                  <p className="text-zinc-400 mb-4">No webhooks configured yet</p>
                  <button
                    onClick={handleCreateClick}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create Your First Webhook
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Form View */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingWebhook ? "Edit Webhook" : "Create New Webhook"}
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                {editingWebhook
                  ? "Update the webhook configuration"
                  : "Set up a new webhook to receive events"}
              </p>
            </div>

            <WebhookForm
              initialData={
                editingWebhook
                  ? {
                      url: editingWebhook.url,
                      events: editingWebhook.events,
                      active: editingWebhook.active,
                      secretKey: editingWebhook.secretKey,
                    }
                  : undefined
              }
              onSubmit={handleFormSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
              isEditing={!!editingWebhook}
            />
          </>
        )}
      </div>
    </div>
  );
}

// Helper component for success message
interface CheckCircleProps {
  className?: string;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

function CheckCircle(props: CheckCircleProps) {
  return (
    <svg
      {...props}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
