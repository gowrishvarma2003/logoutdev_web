"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import { useRepoContext } from "../layout";
import { useRepoDiscussions } from "@/lib/hooks/useRepos";
import { createRepoDiscussion } from "@/lib/services/reposApi";
import { formatRelativeTime } from "@/lib/utils";
import Spinner from "@/components/ui/Spinner";
import { ChatBubbleLeftRightIcon, CheckCircleIcon, CodeBracketSquareIcon, HandRaisedIcon, LightBulbIcon } from "@heroicons/react/24/outline";

type CategoryMeta = {
  icon: ComponentType<{ className?: string }>;
  color: string;
};

const CAT_COLORS: Record<string, CategoryMeta> = {
  general: { icon: ChatBubbleLeftRightIcon, color: "text-zinc-400" },
  "q&a": { icon: HandRaisedIcon, color: "text-blue-400" },
  ideas: { icon: LightBulbIcon, color: "text-yellow-400" },
  "show-and-tell": { icon: CodeBracketSquareIcon, color: "text-purple-400" },
};

export default function DiscussionsPage() {
  const { repo } = useRepoContext();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { discussions, loading, error, refetch } = useRepoDiscussions(repo.id, activeCategory === "all" ? undefined : activeCategory);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;

    setIsSubmitting(true);
    try {
      await createRepoDiscussion(repo.id, {
        title: newTitle,
        body: newBody,
        category: newCategory,
      });
      setIsCreating(false);
      setNewTitle("");
      setNewBody("");
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create discussion";
      alert(`Failed to create discussion: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 md:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Welcome to Discussions!</h1>
          <p className="text-zinc-400 max-w-2xl text-sm">
            Discussions is a collaborative communication forum for the community. Ask questions, share ideas, and build connections.
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-500 whitespace-nowrap"
          >
            New discussion
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="mb-8 rounded-md border border-zinc-800 bg-zinc-900 shadow-md">
          <div className="border-b border-zinc-800 bg-zinc-800/50 px-4 py-3">
            <h2 className="font-semibold text-white">Start a new discussion</h2>
          </div>
          <form onSubmit={handleCreate} className="p-4 md:p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Select Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full max-w-sm rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="general">💬 General</option>
                <option value="q&a">✋ Q&A</option>
                <option value="ideas">💡 Ideas</option>
                <option value="show-and-tell">🙌 Show and tell</option>
              </select>
            </div>
            <div>
              <input
                type="text"
                placeholder="Title"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-lg"
              />
            </div>
            <div>
              <textarea
                required
                rows={6}
                placeholder="Ask a question, share an idea, or start a conversation..."
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newTitle || !newBody}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Spinner size="sm" />}
                Start discussion
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Categories Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <h3 className="text-sm font-semibold text-zinc-400 mb-3 px-2 text-transform uppercase">Categories</h3>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveCategory("all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeCategory === "all" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <span>All discussions</span>
              </button>
              {Object.entries(CAT_COLORS).map(([key, { icon: Icon, color }]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeCategory === key ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="capitalize">{key === "q&a" ? "Q&A" : key.replace(/-/g, " ")}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Discussions List */}
          <div className="flex-1 rounded-md border border-zinc-800 bg-zinc-900/50">
            {loading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <div className="p-4 text-sm text-red-500">{error}</div>
            ) : discussions.length === 0 ? (
              <div className="py-16 text-center">
                <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No discussions found</h3>
                <p className="text-zinc-500 max-w-sm mx-auto">
                  {activeCategory === "all"
                    ? "Welcome to discussions! Start a new conversation to get started."
                    : "No discussions in this category yet."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-800">
                {discussions.map((d) => {
                  const CatIcon = CAT_COLORS[d.category]?.icon || ChatBubbleLeftRightIcon;
                  const catColor = CAT_COLORS[d.category]?.color || "text-zinc-400";
                  
                  return (
                    <li key={d.id} className="p-4 hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <CatIcon className={`h-6 w-6 shrink-0 mt-1 ${catColor}`} />
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/repos/${repo.id}/discussions/${d.id}`}
                            className="text-lg font-semibold text-white hover:text-blue-500 mb-1 inline-block"
                          >
                            {d.title}
                          </Link>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                            {d.is_pinned && <span className="border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">Pinned</span>}
                            {d.is_answered && <span className="border border-green-500/30 text-green-400 flex items-center gap-1 rounded px-1.5 py-0.5"><CheckCircleIcon className="w-3 h-3"/> Answered</span>}
                            <span>
                              {d.author?.username || "Unknown"} started this {formatRelativeTime(d.created_at)}
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="capitalize px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400 font-medium">
                              {d.category === "q&a" ? "Q&A" : d.category.replace(/-/g, " ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
