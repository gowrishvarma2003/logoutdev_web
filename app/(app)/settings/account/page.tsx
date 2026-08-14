"use client";

/**
 * Account Settings Page - /settings/account
 * Manage account information and account deletion
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingsField from "@/components/settings/SettingsField";
import DangerZone from "@/components/settings/DangerZone";
import DangerAction from "@/components/settings/DangerAction";
import DeleteAccountModal from "@/components/settings/DeleteAccountModal";
import Spinner from "@/components/ui/Spinner";
import {
  UserCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      // Simulate API call for account deletion
      // In production, this would call: DELETE /api/settings/account
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Show success and redirect
      setSuccess("Account deleted successfully");
      setShowDeleteModal(false);

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete account"
      );
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your account information and security settings
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3">
          <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-300">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {/* Account Information Section */}
      <SettingsSection
        title="Account Information"
        description="Your basic account details"
        icon={<UserCircleIcon className="w-5 h-5" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-zinc-800">
            <p className="text-xs text-zinc-500">Email</p>
            <p className="text-sm text-white font-medium">user@example.com</p>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-zinc-800">
            <p className="text-xs text-zinc-500">Username</p>
            <p className="text-sm text-white font-medium">@johndoe</p>
          </div>

          <div className="flex items-center justify-between py-2">
            <p className="text-xs text-zinc-500">Full Name</p>
            <p className="text-sm text-white font-medium">John Doe</p>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <button className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-white transition-colors">
              Edit Account
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Danger Zone Section */}
      <DangerZone title="Danger Zone" description="Irreversible and destructive actions">
        <DangerAction
          title="Delete Account"
          description="Permanently delete your account and all associated data"
          buttonText="Delete Account"
          requireConfirmation={true}
          confirmTitle="Delete Your Account?"
          confirmDescription="Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted."
          confirmButtonText="Delete Account"
          onAction={async () => {
            setShowDeleteModal(true);
          }}
        />

        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
          <p className="text-xs text-rose-300">
            ⚠️ This action cannot be undone. You have 30 days to reconsider
            before permanent deletion.
          </p>
        </div>
      </DangerZone>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
