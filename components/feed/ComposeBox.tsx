"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPost, suggestHashtags, suggestUsers } from "@/lib/api";
import type {
  EntityRef,
  HashtagSuggestion,
  Post,
  RelatedHashtag,
  User,
  UserSuggestion,
} from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import RichComposer, { type RichComposerHandle } from "@/components/ui/RichComposer";
import { findActiveRichToken } from "@/lib/richText";
import LinkedEntityCard from "@/components/connected/LinkedEntityCard";

interface ComposeBoxProps {
  currentUser: User;
  onPostCreated: (post: Post) => void;
  placeholder?: string;
  onSubmit?: (content: string) => Promise<Post>;
  compact?: boolean;
  initialLinkedEntity?: EntityRef | null;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
  onClearLinkedEntity?: () => void;
}

interface ActiveToken {
  type: "hashtag" | "mention";
  query: string;
  start: number;
  end: number;
}

type SuggestionItem =
  | {
      kind: "hashtag";
      key: string;
      title: string;
      subtitle: string;
      insert_text: string;
    }
  | {
      kind: "mention";
      key: string;
      title: string;
      subtitle: string;
      insert_text: string;
    };

const MAX_LENGTH = 500;
const MIN_QUERY_LENGTH = 2;
function findActiveToken(value: string, caret: number): ActiveToken | null {
  return findActiveRichToken(value, caret, MIN_QUERY_LENGTH);
}

function mapHashtagSuggestions(items: HashtagSuggestion[]): SuggestionItem[] {
  return items.map((item) => ({
    kind: "hashtag",
    key: item.normalized_tag,
    title: `#${item.tag}`,
    subtitle: `${item.usage_count} posts`,
    insert_text: `#${item.normalized_tag}`,
  }));
}

function mapUserSuggestions(items: UserSuggestion[]): SuggestionItem[] {
  return items.map((item) => ({
    kind: "mention",
    key: item.id,
    title: `@${item.username}`,
    subtitle: item.name,
    insert_text: `@${item.username}`,
  }));
}

export default function ComposeBox({
  currentUser,
  onPostCreated,
  placeholder = "What are you building today?",
  onSubmit,
  compact = false,
  initialLinkedEntity = null,
  linkedEntityType = null,
  linkedEntityId = null,
  onClearLinkedEntity,
}: ComposeBoxProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeToken, setActiveToken] = useState<ActiveToken | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [relatedTags, setRelatedTags] = useState<RelatedHashtag[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const composerRef = useRef<RichComposerHandle>(null);

  const remaining = MAX_LENGTH - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = content.trim().length === 0;
  const isSuggestionOpen = !!activeToken && suggestions.length > 0;

  useEffect(() => {
    if (!activeToken) {
      setSuggestions([]);
      setRelatedTags([]);
      setHighlightedIndex(0);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        if (activeToken.type === "hashtag") {
          const res = await suggestHashtags(activeToken.query);
          if (cancelled) return;
          setSuggestions(mapHashtagSuggestions(res.hashtags));
          setRelatedTags(res.related_tags);
          setHighlightedIndex(0);
        } else {
          const res = await suggestUsers(activeToken.query);
          if (cancelled) return;
          setSuggestions(mapUserSuggestions(res.users));
          setRelatedTags([]);
          setHighlightedIndex(0);
        }
      } catch {
        if (cancelled) return;
        setSuggestions([]);
        setRelatedTags([]);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [activeToken]);

  function updateTextareaHeight() {
    composerRef.current?.adjustHeight?.();
  }

  function updateActiveToken(value: string, caret: number) {
    setActiveToken(findActiveToken(value, caret));
  }

  function applySuggestion(item: SuggestionItem) {
    if (!activeToken) return;

    const suffix = content.slice(activeToken.end);
    const nextContent = `${content.slice(0, activeToken.start)}${item.insert_text} ${suffix.replace(/^ /, "")}`;
    const nextCaret = activeToken.start + item.insert_text.length + 1;

    setContent(nextContent);
    setActiveToken(null);
    setSuggestions([]);
    setRelatedTags([]);
    setHighlightedIndex(0);
    setError("");

    window.requestAnimationFrame(() => {
      const textarea = composerRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(nextCaret, nextCaret);
      updateTextareaHeight();
    });
  }

  const handleChange = (nextValue: string, caret: number) => {
    setContent(nextValue);
    setError("");
    updateActiveToken(nextValue, caret);
    updateTextareaHeight();
  };

  const handleCursorActivity = () => {
    const textarea = composerRef.current?.getElement();
    if (!textarea) return;
    updateActiveToken(textarea.value, textarea.selectionStart ?? textarea.value.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSuggestionOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      applySuggestion(suggestions[highlightedIndex] || suggestions[0]);
      return;
    }

    if (e.key === "Escape") {
      setActiveToken(null);
      setSuggestions([]);
      setRelatedTags([]);
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
        const res = await createPost(
          content.trim(),
          linkedEntityType && linkedEntityId
            ? { type: linkedEntityType, id: linkedEntityId }
            : null
        );
        post = res.post;
      }
      setContent("");
      setActiveToken(null);
      setSuggestions([]);
      setRelatedTags([]);
      composerRef.current?.resetHeight?.();
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
      <Avatar user={currentUser} size={compact ? "sm" : "md"} className="mt-0.5 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="relative">
          {initialLinkedEntity ? (
            <div className="mb-3">
              <LinkedEntityCard entity={initialLinkedEntity} compact />
              {onClearLinkedEntity ? (
                <button
                  type="button"
                  onClick={onClearLinkedEntity}
                  className="mt-2 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  Remove attachment
                </button>
              ) : null}
            </div>
          ) : null}

          <RichComposer
            ref={composerRef}
            value={content}
            onChange={handleChange}
            onClick={handleCursorActivity}
            onKeyUp={handleCursorActivity}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={MAX_LENGTH + 10}
            rows={compact ? 1 : 3}
            clickablePreview
            previewClassName="text-[15px] leading-relaxed text-white"
            className="relative w-full resize-none overflow-hidden bg-transparent text-[15px] leading-relaxed text-transparent caret-white outline-none selection:bg-[#1d9bf0]/30"
          />

          {isSuggestionOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
              <div className="border-b border-zinc-800 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                {activeToken?.type === "hashtag" ? "Hashtag suggestions" : "Mention people"}
              </div>
              <ul>
                {suggestions.map((item, index) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => applySuggestion(item)}
                      className={`flex w-full items-center justify-between gap-4 px-3 py-2.5 text-left transition-colors ${
                        highlightedIndex === index ? "bg-zinc-800" : "hover:bg-zinc-800/70"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{item.title}</p>
                        <p className="truncate text-xs text-zinc-500">{item.subtitle}</p>
                      </div>
                      <span className="text-[11px] uppercase tracking-wide text-zinc-600">
                        {item.kind}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {activeToken?.type === "hashtag" && relatedTags.length > 0 && (
                <div className="border-t border-zinc-800 px-3 py-2">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                    Related tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {relatedTags.map((tag) => (
                      <button
                        key={tag.normalized_tag}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() =>
                          applySuggestion({
                            kind: "hashtag",
                            key: `related:${tag.normalized_tag}`,
                            title: `#${tag.tag}`,
                            subtitle: `${tag.cooccurrence_count} related posts`,
                            insert_text: `#${tag.normalized_tag}`,
                          })
                        }
                        className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-sky-300 hover:bg-zinc-800"
                      >
                        #{tag.tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800">
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

          <button
            type="submit"
            disabled={isEmpty || isOverLimit || isLoading}
            className="px-5 py-1.5 rounded-full bg-white text-zinc-950 text-sm font-semibold
              disabled:opacity-30 disabled:cursor-not-allowed
              hover:bg-zinc-100 active:scale-95 transition-all"
          >
            {isLoading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
