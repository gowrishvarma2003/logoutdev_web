"use client";

/**
 * Settings → Profile → Portfolio page — /settings/profile/portfolio
 * Manage user's portfolio items (create, edit, delete, reorder)
 */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { ArrowLeftIcon, PlusIcon, BriefcaseIcon } from "@/components/ui/Icons";
import Spinner from "@/components/ui/Spinner";
import SettingsSection from "@/components/settings/SettingsSection";
import PortfolioItemForm, { type PortfolioItemFormData } from "@/components/settings/PortfolioItemForm";
import PortfolioItemCard from "@/components/settings/PortfolioItemCard";

// Simulated portfolio items storage (in production, this would be backend API)
const STORAGE_KEY = "user_portfolio_items";

function getStoredPortfolioItems(): PortfolioItemFormData[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function savePortfolioItems(items: PortfolioItemFormData[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

interface PortfolioItemWithIndex extends PortfolioItemFormData {
  id: string;
}

export default function PortfolioPage() {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState<PortfolioItemWithIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItemWithIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);

  // Load portfolio items on mount
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simulate API fetch delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        const stored = getStoredPortfolioItems();
        setItems(stored as PortfolioItemWithIndex[]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load portfolio items";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  const handleSaveItem = useCallback(
    async (formData: PortfolioItemFormData) => {
      try {
        setIsSaving(true);
        setError(null);

        // Simulate API save delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (editingItem && editingItem.id) {
          // Update existing item
          const updated = items.map((item) =>
            item.id === editingItem.id
              ? { ...formData, id: editingItem.id }
              : item
          );
          setItems(updated);
          savePortfolioItems(updated);
        } else {
          // Create new item
          const newItem: PortfolioItemWithIndex = {
            ...formData,
            id: `portfolio_${Date.now()}`,
          };
          const updated = [...items, newItem];
          setItems(updated);
          savePortfolioItems(updated);
        }

        setIsCreating(false);
        setEditingItem(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save portfolio item";
        setError(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [items, editingItem]
  );

  const handleDeleteItem = useCallback(
    async (id: string) => {
      try {
        setDeleteInProgress(id);
        setError(null);

        // Simulate API delete delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const updated = items.filter((item) => item.id !== id);
        setItems(updated);
        savePortfolioItems(updated);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete portfolio item";
        setError(message);
        throw err;
      } finally {
        setDeleteInProgress(null);
      }
    },
    [items]
  );

  const handleMoveItem = useCallback(
    (id: string, direction: "up" | "down") => {
      const index = items.findIndex((item) => item.id === id);
      if (
        (direction === "up" && index === 0) ||
        (direction === "down" && index === items.length - 1)
      ) {
        return;
      }

      const updated = [...items];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      
      setItems(updated);
      savePortfolioItems(updated);
    },
    [items]
  );

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 mb-6">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link
            href="/settings/profile"
            className="p-1.5 -ml-1.5 rounded-full text-zinc-400 hover:bg-zinc-800 transition-colors"
            aria-label="Go back to profile settings"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <BriefcaseIcon className="w-4 h-4 text-zinc-400" />
            <h1 className="text-[15px] font-bold text-white">Portfolio</h1>
          </div>
        </div>
      </header>

      {/* ── Error message ── */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-400 text-sm">
          <p>{error}</p>
        </div>
      )}

      {/* ── Form section (create/edit) ── */}
      {(isCreating || editingItem) && (
        <SettingsSection
          title={editingItem ? "Edit Portfolio Item" : "Add Portfolio Item"}
          description={
            editingItem
              ? "Update this portfolio item"
              : "Create a new portfolio item to showcase your work"
          }
          headingLevel="h2"
        >
          <PortfolioItemForm
            item={editingItem || undefined}
            onSave={handleSaveItem}
            onCancel={() => {
              setIsCreating(false);
              setEditingItem(null);
            }}
            loading={isSaving}
          />
        </SettingsSection>
      )}

      {/* ── Portfolio list section ── */}
      {!isCreating && !editingItem && (
        <SettingsSection
          title="Your Portfolio"
          description={`Showcase ${items.length} project${items.length !== 1 ? "s" : ""} on your profile`}
          headingLevel="h2"
        >
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-800 mb-4">
                <BriefcaseIcon className="w-6 h-6 text-zinc-500" />
              </div>
              <h3 className="text-sm font-medium text-zinc-300 mb-1">No portfolio items yet</h3>
              <p className="text-xs text-zinc-500 mb-4">
                Add your first project to showcase your work
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors"
                aria-label="Add first portfolio item"
              >
                <PlusIcon className="w-4 h-4" />
                Add First Item
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                <PortfolioItemCard
                  key={item.id}
                  item={item}
                  onEdit={(editItem) => setEditingItem(editItem as PortfolioItemWithIndex)}
                  onDelete={handleDeleteItem}
                  onMoveUp={() => handleMoveItem(item.id, "up")}
                  onMoveDown={() => handleMoveItem(item.id, "down")}
                  canMoveUp={index > 0}
                  canMoveDown={index < items.length - 1}
                  isDeleting={deleteInProgress === item.id}
                />
              ))}

              {/* Add another button */}
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-3 rounded-lg border border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-300 hover:border-zinc-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                aria-label="Add another portfolio item"
              >
                <PlusIcon className="w-4 h-4" />
                Add Another Item
              </button>
            </div>
          )}
        </SettingsSection>
      )}
    </div>
  );
}
