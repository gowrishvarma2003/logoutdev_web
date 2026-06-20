"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { createReply, deletePost } from "@/lib/api";
import type { Post, PostHashtagEntity, PostMentionEntity, User } from "@/lib/types";
import { formatRelativeTime, emailToHandle } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
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
    <p className="mt-1.5 text-[15px] text-zinc-100 leading-relaxed whitespace-pre-wrap break-words">
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
      className={`relative border-b border-zinc-800 px-4 py-4 transition-colors ${
        clickable ? "hover:bg-zinc-900/70 cursor-pointer" : ""
      }`}
    >
      {post.is_repost && (
        <div className="mb-2 ml-[52px] flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <RepeatIcon className="h-3.5 w-3.5" />
          <span>{post.author?.name ?? "Someone"} reposted</span>
        </div>
      )}

      <div className="flex gap-3">
        <Avatar user={post.author ?? null} size="md" className="mt-0.5 shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-1.5">
            <span className="text-sm font-semibold leading-snug text-white">
              {post.author?.name ?? "Unknown"}
            </span>
            <span className="truncate text-sm leading-snug text-zinc-500">
              @{getAuthorHandle(post.author)}
            </span>
            <span className="text-sm text-zinc-700">·</span>
            <span className="shrink-0 text-xs text-zinc-500">
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

          {post.images && post.images.length > 0 && <div className={`mt-3 grid gap-1 overflow-hidden rounded-2xl border border-zinc-800 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`} onClick={(event) => event.stopPropagation()}>{post.images.map((image, index) => <button key={image.id} type="button" onClick={() => setLightboxImage(image.url)} className={`${post.images?.length === 3 && index === 0 ? "col-span-2" : ""} overflow-hidden bg-zinc-900`} aria-label={`Open image ${index + 1}`}>
            <img src={image.url} alt={`Post image ${index + 1}`} className={`w-full object-cover ${post.images?.length === 1 ? "max-h-[520px]" : "h-48"}`} />
          </button>)}</div>}

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
              className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
              aria-label="Post options"
            >
              <DotsIcon />
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
                <div className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 transition-colors hover:bg-rose-500/10 disabled:opacity-50"
                  >
                    <TrashIcon />
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
          className="ml-[52px] mt-3 border-t border-zinc-800 pt-3"
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
      {lightboxImage && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Post image preview" onClick={(event) => { event.stopPropagation(); setLightboxImage(null); }}>
        <img src={lightboxImage} alt="Expanded post image" className="max-h-full max-w-full object-contain" />
        <button type="button" className="absolute right-5 top-5 rounded-full bg-zinc-900 px-3 py-2 text-white" aria-label="Close image preview" onClick={() => setLightboxImage(null)}>×</button>
      </div>}

      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(false);
          }}
        >
          <div 
            className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-white mb-2">Delete Post?</h3>
            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              Are you sure you want to delete this post? This action cannot be undone and it will be permanently removed from the feed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
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
                className="rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-zinc-950 px-4 py-2 text-xs font-bold text-rose-400 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
