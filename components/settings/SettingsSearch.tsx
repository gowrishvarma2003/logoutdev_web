"use client";

/**
 * SettingsSearch - Searchable dropdown for finding settings
 * Features:
 * - Real-time search with debouncing (optimized with debounce utility)
 * - Keyboard navigation (up/down arrows, enter to select)
 * - Click outside to close
 * - Escape key to close
 * - Results grouped by category
 */

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import {
  searchSettings,
  SETTINGS_INDEX,
  SettingEntry,
  getAllCategories,
} from "@/lib/constants/settingsIndex";
import { useDebouncedCallback } from "@/lib/utils/debounce";

interface SettingsSearchProps {
  onSelect?: (setting: SettingEntry) => void;
  placeholder?: string;
}

interface SearchResult {
  category: string;
  settings: SettingEntry[];
}

export default function SettingsSearch({
  onSelect,
  placeholder = "Search settings...",
}: SettingsSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search function - optimized with useDebouncedCallback
  const performSearch = useDebouncedCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const searchResults = searchSettings(searchQuery);

    // Group results by category
    const categories = getAllCategories();
    const grouped: SearchResult[] = categories
      .map((category) => ({
        category,
        settings: searchResults.filter((s) => s.category === category),
      }))
      .filter((g) => g.settings.length > 0);

    setResults(grouped);
    setSelectedIndex(-1);
  }, 300);

  // Handle search input changes
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    performSearch(newQuery);
  }, [performSearch]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get setting at specific index across all groups
  function getSettingAtIndex(index: number): SettingEntry | null {
    let currentIndex = 0;
    for (const group of results) {
      for (const setting of group.settings) {
        if (currentIndex === index) {
          return setting;
        }
        currentIndex++;
      }
    }
    return null;
  }

  // Check if a setting is at the selected index
  function isSettingSelected(setting: SettingEntry): boolean {
    if (selectedIndex < 0) return false;
    const selectedSetting = getSettingAtIndex(selectedIndex);
    return selectedSetting?.id === setting.id;
  }

  function handleSelectSetting(setting: SettingEntry | null) {
    if (!setting) return;

    setQuery("");
    setIsOpen(false);
    onSelect?.(setting);
  }

  function handleSettingClick(setting: SettingEntry) {
    handleSelectSetting(setting);
  }

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen || results.length === 0) {
        if (event.key === "/" && document.activeElement !== inputRef.current) {
          event.preventDefault();
          inputRef.current?.focus();
          setIsOpen(true);
        }
        return;
      }

      // Calculate total items count
      const totalItems = results.reduce((sum, group) => sum + group.settings.length, 0);

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < totalItems - 1 ? prev + 1 : -1
          );
          break;

        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev > -1 ? prev - 1 : totalItems - 1
          );
          break;

        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0) {
            handleSelectSetting(getSettingAtIndex(selectedIndex));
          }
          break;

        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setQuery("");
          break;
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, results, selectedIndex, getSettingAtIndex, handleSelectSetting]);

  return (
    <div className="relative w-full max-w-md" ref={containerRef}>
      {/* Search Input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            handleQueryChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      {/* Dropdown Results */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {results.map((group) => (
            <div key={group.category}>
              {/* Category Header */}
              <div className="sticky top-0 px-4 py-2 bg-zinc-950 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {group.category}
              </div>

              {/* Settings in Category */}
              {group.settings.map((setting) => (
                <Link
                  key={setting.id}
                  href={setting.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSettingClick(setting);
                  }}
                >
                  <div
                    className={`px-4 py-3 cursor-pointer transition-colors border-b border-zinc-800/50 last:border-b-0 ${
                      isSettingSelected(setting)
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-300 hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium">{setting.name}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                          {setting.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg z-50 px-4 py-6 text-center">
          <p className="text-sm text-zinc-400">
            No settings found for &ldquo;<span className="font-medium">{query}</span>&rdquo;
          </p>
          <p className="text-xs text-zinc-600 mt-2">
            Try searching by name, category, or keywords
          </p>
        </div>
      )}

      {/* Keyboard Shortcut Hint */}
      {!isOpen && !query && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <kbd className="px-2 py-1 text-xs font-semibold text-zinc-500 bg-zinc-800 rounded border border-zinc-700">
            /
          </kbd>
        </div>
      )}
    </div>
  );
}
