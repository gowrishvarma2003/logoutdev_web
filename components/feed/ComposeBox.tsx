"use client";
/* eslint-disable @next/next/no-img-element */

import { FormEvent, useEffect, useRef, useState } from "react";
import { createPost, suggestHashtags, suggestUsers, suggestPlatformEntities } from "@/lib/api";
import type {
  EntityRef,
  HashtagSuggestion,
  Post,
  RelatedHashtag,
  User,
  UserSuggestion,
  PlatformEntity,
} from "@/lib/types";
import Avatar from "@/components/ui/Avatar";
import RichComposer, { type RichComposerHandle } from "@/components/ui/RichComposer";
import { findActiveRichToken } from "@/lib/richText";
import LinkedEntityCard from "@/components/connected/LinkedEntityCard";
import Spinner from "@/components/ui/Spinner";

interface ComposeBoxProps {
  currentUser: User;
  onPostCreated: (post: Post) => void;
  placeholder?: string;
  onSubmit?: (content: string, entityTags: PlatformEntity[], images: File[]) => Promise<Post>;
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
  const [entityPickerOpen, setEntityPickerOpen] = useState(false);
  const [entityQuery, setEntityQuery] = useState("");
  const [entityType, setEntityType] = useState("");
  const [entityResults, setEntityResults] = useState<PlatformEntity[]>([]);
  const [entityHighlight, setEntityHighlight] = useState(0);
  const [entityLoading, setEntityLoading] = useState(false);
  const entityCacheRef = useRef<Record<string, PlatformEntity[]>>({});
  const [selectedEntities, setSelectedEntities] = useState<PlatformEntity[]>(initialLinkedEntity ? [initialLinkedEntity as PlatformEntity] : []);
  const [selectedImages, setSelectedImages] = useState<Array<{ file: File; url: string }>>([]);
  const imagesRef = useRef(selectedImages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<RichComposerHandle>(null);

  const remaining = MAX_LENGTH - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = content.trim().length === 0 && selectedEntities.length === 0 && selectedImages.length === 0;
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

  useEffect(() => { imagesRef.current = selectedImages; }, [selectedImages]);
  useEffect(() => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url)), []);

  useEffect(() => {
    if (!entityPickerOpen) return;

    const cacheKey = `${entityType}:${entityQuery}`;
    const cached = entityCacheRef.current[cacheKey];

    if (cached) {
      setEntityResults(cached.filter((entity) => !selectedEntities.some((selected) => selected.type === entity.type && selected.id === entity.id)));
      setEntityHighlight(0);
      setEntityLoading(false);
      return;
    }

    let cancelled = false;
    setEntityLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const result = await suggestPlatformEntities(entityQuery, entityType ? [entityType] : []);
        if (!cancelled) {
          entityCacheRef.current[cacheKey] = result.entities;
          setEntityResults(result.entities.filter((entity) => !selectedEntities.some((selected) => selected.type === entity.type && selected.id === entity.id)));
          setEntityHighlight(0);
        }
      } catch { 
        if (!cancelled) setEntityResults([]); 
      } finally {
        if (!cancelled) setEntityLoading(false);
      }
    }, 180);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [entityPickerOpen, entityQuery, entityType, selectedEntities]);

  useEffect(() => {
    if (!initialLinkedEntity) return;
    setSelectedEntities((current) => current.some((item) => item.type === initialLinkedEntity.type && item.id === initialLinkedEntity.id)
      ? current : [initialLinkedEntity as PlatformEntity, ...current].slice(0, 5));
  }, [initialLinkedEntity]);

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
        post = await onSubmit(content.trim(), selectedEntities, selectedImages.map((image) => image.file));
      } else {
        const tags = selectedEntities.length ? selectedEntities : linkedEntityType && linkedEntityId ? [{ type: linkedEntityType, id: linkedEntityId } as PlatformEntity] : [];
        const res = await createPost(content.trim(), tags.map(({ type, id }) => ({ type, id })), selectedImages.map((image) => image.file));
        post = res.post;
      }
      setContent("");
      setActiveToken(null);
      setSuggestions([]);
      setRelatedTags([]);
      setSelectedEntities([]);
      entityCacheRef.current = {};
      selectedImages.forEach((image) => URL.revokeObjectURL(image.url));
      setSelectedImages([]);
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
      className={`flex gap-3 ${compact ? "px-4 py-3" : "px-4 py-4 border-b border-zinc-800/60 bg-zinc-950/20"}`}
    >
      <Avatar user={currentUser} size={compact ? "sm" : "md"} className="mt-0.5 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="relative">
          {selectedEntities.length > 0 && (
            <div className="mb-3 space-y-2">
              {selectedEntities.map((entity) => (
                <div key={`${entity.type}:${entity.id}`} className="relative">
                  <LinkedEntityCard entity={entity} compact />
                  <button
                    type="button"
                    aria-label={`Remove ${entity.title}`}
                    onClick={() => {
                      setSelectedEntities((items) => items.filter((item) => item !== entity));
                      if (initialLinkedEntity?.id === entity.id) onClearLinkedEntity?.();
                    }}
                    className="absolute right-2 top-2 rounded-full bg-zinc-955/90 px-2 py-0.5 text-xs text-zinc-300 hover:text-white border border-zinc-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

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
            <div className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-955/95 backdrop-blur-xl shadow-2xl p-1">
              <div className="border-b border-zinc-900/65 px-3 py-2 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                {activeToken?.type === "hashtag" ? "Hashtag suggestions" : "Mention people"}
              </div>
              <ul className="space-y-0.5 mt-1">
                {suggestions.map((item, index) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => applySuggestion(item)}
                      className={`flex w-full items-center justify-between gap-4 px-3 py-2 rounded-xl text-left transition-all ${
                        highlightedIndex === index ? "bg-zinc-900 text-white" : "hover:bg-zinc-900/40 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.title}</p>
                        <p className="truncate text-xs text-zinc-500 font-mono mt-0.5">{item.subtitle}</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-600">
                        {item.kind}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {activeToken?.type === "hashtag" && relatedTags.length > 0 && (
                <div className="border-t border-zinc-900/65 px-3 py-2 mt-1">
                  <p className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                    Related tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
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
                        className="rounded-full border border-zinc-800 bg-zinc-900/20 px-2.5 py-0.5 text-xs text-sky-400 hover:bg-zinc-800 transition-colors"
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

        {selectedImages.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {selectedImages.map((image, index) => (
              <div key={image.url} className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                <img src={image.url} alt={`Selected image ${index + 1}`} className="h-32 w-full object-cover" />
                <button
                  type="button"
                  aria-label={`Remove image ${index + 1}`}
                  onClick={() => {
                    URL.revokeObjectURL(image.url);
                    setSelectedImages((items) => items.filter((item) => item !== image));
                  }}
                  className="absolute right-2 top-2 rounded-full bg-black/75 px-2 py-0.5 text-xs text-white hover:bg-black/90 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {entityPickerOpen && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-1.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2 px-2.5 pt-1.5">
              <div className="flex flex-wrap gap-1">
                {[
                  ["", "All"],
                  ["launch", "Launches"],
                  ["repo", "Repos"],
                  ["space", "Spaces"],
                  ["question", "Questions"],
                  ["freelance_project", "Freelance"]
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setEntityType(value)}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                      entityType === value ? "bg-white text-black shadow-sm" : "bg-zinc-900/60 text-zinc-450 hover:bg-zinc-850"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setEntityPickerOpen(false)}
                className="rounded-lg px-2 py-0.5 text-xs text-zinc-450 hover:text-white hover:bg-zinc-900 transition-all font-semibold cursor-pointer shrink-0 ml-2"
                aria-label="Close tagging component"
              >
                Close
              </button>
            </div>
            <input
              autoFocus
              value={entityQuery}
              onChange={(event) => setEntityQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setEntityHighlight((value) => Math.min(value + 1, entityResults.length - 1));
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setEntityHighlight((value) => Math.max(value - 1, 0));
                }
                if (event.key === "Enter" && entityResults[entityHighlight]) {
                  event.preventDefault();
                  setSelectedEntities((items) => [...items, entityResults[entityHighlight]].slice(0, 5));
                }
                if (event.key === "Escape") setEntityPickerOpen(false);
              }}
              placeholder="Search platform items..."
              className="w-full border-b border-zinc-900 bg-transparent px-3 py-2 text-xs text-white outline-none focus:border-zinc-850"
            />
            {entityLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto mt-1 space-y-0.5">
                {entityResults.map((entity, index) => (
                  <button
                    type="button"
                    key={`${entity.type}:${entity.id}`}
                    onClick={() => setSelectedEntities((items) => [...items, entity].slice(0, 5))}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 rounded-xl text-left cursor-pointer transition-all ${
                      index === entityHighlight ? "bg-zinc-900" : "hover:bg-zinc-900/40"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-white">{entity.title}</span>
                      <span className="block truncate text-[10px] text-zinc-500 mt-0.5">
                        {entity.owner?.name || entity.type.replace("_", " ")}
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] uppercase font-bold border ${
                        entity.visibility === "private"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      {entity.visibility}
                    </span>
                  </button>
                ))}
                {!entityLoading && entityResults.length === 0 && (
                  <p className="text-center text-xs text-zinc-500 py-8">No results found.</p>
                )}
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-1 text-xs text-rose-505">{error}</p>}

        {selectedEntities.some((entity) => entity.visibility === "private") && (
          <p className="mt-2 text-xs text-amber-300 font-medium">Restricted: only people who can access every private tagged item can view this post.</p>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedEntities.length >= 5}
              onClick={() => setEntityPickerOpen((open) => !open)}
              className="rounded-full border border-zinc-850 bg-zinc-900/30 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-40 cursor-pointer"
            >
              Tag item {selectedEntities.length}/5
            </button>
            <button
              type="button"
              disabled={selectedImages.length >= 4}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-zinc-850 bg-zinc-900/30 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-40 cursor-pointer"
            >
              Add images {selectedImages.length}/4
            </button>
            <input
              ref={fileInputRef}
              hidden
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                const picked = Array.from(event.target.files || []);
                const files = picked.filter((file) => !selectedImages.some((image) => image.file.name === file.name && image.file.size === file.size && image.file.lastModified === file.lastModified));
                if (files.length !== picked.length) setError("That image is already selected.");
                if (selectedImages.length + files.length > 4) {
                  setError("You can attach at most 4 images.");
                  event.target.value = "";
                  return;
                }
                const invalid = files.find((file) => file.size > 10 * 1024 * 1024);
                if (invalid) {
                  setError("Each image must be 10MB or smaller.");
                  event.target.value = "";
                  return;
                }
                setSelectedImages((items) => [...items, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
                event.target.value = "";
              }}
            />
          </div>
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
            className="px-5 py-1.5 rounded-full bg-white text-black text-sm font-semibold
              disabled:opacity-30 disabled:cursor-not-allowed
              hover:bg-zinc-100 active:scale-95 transition-all cursor-pointer"
          >
            {isLoading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
