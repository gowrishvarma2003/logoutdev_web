"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { createReply, deletePost } from "@/lib/api";
import type { Post, PostHashtagEntity, PostMentionEntity, User } from "@/lib/types";
import { formatRelativeTime, emailToHandle } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import PostActions from "./PostActions";
import ComposeBox from "./ComposeBox";
import { DotsIcon, TrashIcon, RepeatIcon } from "@/components/ui/Icons";
import LinkedEntityCard from "@/components/connected/LinkedEntityCard";

interface PostCardProps {
  post: Post;
  currentUser: User;
  onUpdate: (updated: Post) => void;
  onDelete: (id: string) => void;
  clickable?: boolean;
  showReplies?: boolean;
}

type ContentToken =
  | ({ type: "hashtag" } & PostHashtagEntity)
  | ({ type: "mention" } & PostMentionEntity);

function getAuthorHandle(user?: User) {
  return user?.username || emailToHandle(user?.email);
}

function buildContentTokens(
  hashtags: PostHashtagEntity[] = [],
  mentions: PostMentionEntity[] = []
): ContentToken[] {
  return [
    ...hashtags.map((tag) => ({ ...tag, type: "hashtag" as const })),
    ...mentions.map((mention) => ({ ...mention, type: "mention" as const })),
  ].sort((a, b) => a.start_index - b.start_index);
}

function PostContent({ text, hashtags, mentions, clickable }: { text: string; hashtags?: PostHashtagEntity[]; mentions?: PostMentionEntity[]; clickable: boolean; }) {
  const tokens = buildContentTokens(hashtags, mentions);
  let cursor = 0;
  const fragments: ReactNode[] = [];

  for (const token of tokens) {
    if (token.start_index < cursor || token.end_index > text.length || token.start_index >= token.end_index) {
      continue;
    }

    if (token.start_index > cursor) {
      fragments.push(<span key={`text:${cursor}`}>{text.slice(cursor, token.start_index)}</span>);
    }

    const rawValue = text.slice(token.start_index, token.end_index);
    if (token.type === "hashtag") {
      fragments.push(
        <Link
          key={`hashtag:${token.start_index}`}
          href={`/hashtags/${token.normalized_tag}`}
          onClick={(event) => {
            if (clickable) event.stopPropagation();
          }}
          className="text-sky-400 hover:underline"
        >
          {rawValue}
        </Link>
      );
    } else {
      fragments.push(
        <Link
          key={`mention:${token.start_index}`}
          href={`/profile/${token.username}`}
          onClick={(event) => {
            if (clickable) event.stopPropagation();
          }}
          className="text-sky-400 hover:underline"
        >
          {rawValue}
        </Link>
      );
    }

    cursor = token.end_index;
  }

  if (cursor < text.length) {
    fragments.push(<span key={`tail:${cursor}`}>{text.slice(cursor)}</span>);
  }

  return (
    <p className="mt-1.5 text-[15px] text-text-primary leading-relaxed whitespace-pre-wrap break-words">
      {fragments}
    </p>
  );
}

export default function PostCard({
  post,
  currentUser,
  onUpdate,
  onDelete,
  clickable = true,
  showReplies = false,
}: PostCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyOpen, setReplyOpen] = useState(showReplies);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwn = post.user_id === currentUser.id;

  const handleCardClick = () => {
    if (clickable) router.push(`/post/${post.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setMenuOpen(false);
  };

  return (
    <article
      onClick={clickable ? handleCardClick : undefined}
      className={`relative border-b border-border-subtle/60 px-5 py-4.5 transition-all duration-200 ${
        clickable ? "hover:bg-surface/25 cursor-pointer" : ""
      }`}
    >
      {post.is_repost && (
        <div className="mb-2 ml-[52px] flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <RepeatIcon className="h-3.5 w-3.5" />
          <span>{post.author?.name ?? "Someone"} reposted</span>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href={`/profile/${getAuthorHandle(post.author)}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <Avatar user={post.author ?? null} size="md" className="mt-0.5" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <ProfileHoverCard username={getAuthorHandle(post.author)} user={post.author}>
              <Link
                href={`/profile/${getAuthorHandle(post.author)}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-semibold leading-snug text-text-primary hover:text-text-primary transition-colors hover:underline"
              >
                {post.author?.name ?? "Unknown"}
              </Link>
            </ProfileHoverCard>
            <Link
              href={`/profile/${getAuthorHandle(post.author)}`}
              onClick={(e) => e.stopPropagation()}
              className="truncate text-xs leading-snug text-text-muted hover:text-text-secondary transition-colors"
            >
              @{getAuthorHandle(post.author)}
            </Link>
            <span className="text-text-disabled text-xs font-bold">·</span>
            <span className="shrink-0 text-xs text-text-disabled font-medium" title={new Date(post.created_at).toLocaleString()}>
              {formatRelativeTime(post.created_at)}
            </span>
          </div>

          <PostContent
            text={post.content}
            hashtags={post.hashtags}
            mentions={post.mentions}
            clickable={clickable}
          />

          {(post.entity_tags?.length ? post.entity_tags : post.linked_entity ? [post.linked_entity] : []).map((entity) => <div className="mt-3" key={`${entity.type}:${entity.id}`} onClick={(event) => event.stopPropagation()}><LinkedEntityCard entity={entity} compact /></div>)}

          {post.images && post.images.length > 0 && (
            <div
              className={`mt-3.5 grid gap-2 overflow-hidden rounded-2xl border border-border-default/80 bg-app/40 p-1 ${
                post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              {post.images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setLightboxImage(image.url)}
                  className={`group relative ${
                    post.images?.length === 3 && index === 0 ? "col-span-2" : ""
                  } overflow-hidden rounded-xl bg-surface/60 border border-border-default/40`}
                  aria-label={`Open image ${index + 1}`}
                >
                  <img
                    src={image.url}
                    alt={`Post image ${index + 1}`}
                    className={`w-full object-cover transition-transform duration-300 group-hover:scale-[1.015] ${
                      post.images?.length === 1 ? "max-h-[520px]" : "h-48"
                    }`}
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>
              ))}
            </div>
          )}

          {post.audience === "restricted" && <div className="mt-2 text-xs text-amber-300">Restricted audience</div>}

          <PostActions
            post={post}
            onUpdate={onUpdate}
            onReplyClick={() => setReplyOpen((open) => !open)}
          />
        </div>

        {isOwn && (
          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              className="rounded-full p-2 text-text-disabled transition-all hover:bg-surface/80 hover:text-text-secondary active:scale-90 cursor-pointer"
              aria-label="Post options"
            >
              <DotsIcon className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-border-default/80 bg-app/95 backdrop-blur-xl shadow-2xl p-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500/10 disabled:opacity-50 cursor-pointer"
                  >
                    <TrashIcon className="h-4 w-4 shrink-0" />
                    {isDeleting ? "Deleting..." : "Delete post"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {replyOpen && (
        <div
          className="ml-[52px] mt-3 border-t border-border-default pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          <ComposeBox
            currentUser={currentUser}
            placeholder="Write a reply..."
            compact
            onSubmit={async (content, entityTags, images) => {
              const res = await createReply(post.id, content, entityTags.map(({ type, id }) => ({ type, id })), images);
              onUpdate({ ...post, reply_count: (post.reply_count ?? 0) + 1 });
              return res.reply;
            }}
            onPostCreated={() => setReplyOpen(false)}
          />
        </div>
      )}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-zoom-out"
          role="dialog"
          aria-modal="true"
          aria-label="Post image preview"
          onClick={(event) => {
            event.stopPropagation();
            setLightboxImage(null);
          }}
        >
          <img src={lightboxImage} alt="Expanded post image" className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" />
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full bg-surface/80 backdrop-blur-md border border-border-default px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all cursor-pointer shadow-lg"
            aria-label="Close image preview"
            onClick={() => setLightboxImage(null)}
          >
            Close
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-rose-500/20 bg-app p-6 shadow-2xl shadow-rose-950/10 transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-text-primary mb-2">Delete Post?</h3>
            <p className="text-xs text-text-muted mb-5 leading-relaxed">
              Are you sure you want to delete this post? This action cannot be undone and it will be permanently removed from the feed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl bg-surface/80 border border-border-default hover:bg-surface-hover px-4 py-2 text-xs font-semibold text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isDeleting) return;
                  setIsDeleting(true);
                  try {
                    await deletePost(post.id);
                    onDelete(post.id);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsDeleting(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 border border-rose-600/30 px-4 py-2 text-xs font-bold text-text-primary hover:scale-[1.01] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
