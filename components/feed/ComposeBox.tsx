"use client";

import { FormEvent, useRef, useState } from "react";
import { createPost } from "@/lib/api";
import type { Post, User } from "@/lib/types";
import Avatar from "@/components/ui/Avatar";

interface ComposeBoxProps {
  currentUser: User;
  onPostCreated: (post: Post) => void;
  placeholder?: string;
  /** Called instead of createPost API when replying */
  onSubmit?: (content: string) => Promise<Post>;
  compact?: boolean;
}

const MAX_LENGTH = 500;

export default function ComposeBox({
  currentUser,
  onPostCreated,
  placeholder = "What are you building today?",
  onSubmit,
  compact = false,
}: ComposeBoxProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remaining = MAX_LENGTH - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = content.trim().length === 0;

  /** Auto-grow textarea height */
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setError("");
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${ta.scrollHeight}px`;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isEmpty || isOverLimit || isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      let post: Post;
      if (onSubmit) {
        post = await onSubmit(content.trim());
      } else {
        const res = await createPost(content.trim());
        post = res.post;
      }
      setContent("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      onPostCreated(post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex gap-3 ${compact ? "px-4 py-3" : "px-4 py-4 border-b border-zinc-800"}`}
    >
      {/* Avatar */}
      <Avatar user={currentUser} size={compact ? "sm" : "md"} className="mt-0.5 shrink-0" />

      <div className="flex-1 min-w-0">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={MAX_LENGTH + 10}
          rows={compact ? 1 : 3}
          className="w-full resize-none text-white placeholder:text-zinc-500 text-[15px] leading-relaxed outline-none bg-transparent overflow-hidden"
        />

        {/* Error */}
        {error && (
          <p className="text-xs text-rose-500 mt-1">{error}</p>
        )}

        {/* Toolbar row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
          {/* Character counter */}
          <span
            className={`text-xs tabular-nums ${
              isOverLimit
                ? "text-rose-400 font-medium"
                : remaining <= 50
                ? "text-amber-400"
                : "text-zinc-500"
            }`}
          >
            {remaining}
          </span>

          {/* Submit */}
          <button
            type="submit"
            disabled={isEmpty || isOverLimit || isLoading}
            className="px-5 py-1.5 rounded-full bg-white text-zinc-950 text-sm font-semibold
              disabled:opacity-30 disabled:cursor-not-allowed
              hover:bg-zinc-100 active:scale-95 transition-all"
          >
            {isLoading ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
