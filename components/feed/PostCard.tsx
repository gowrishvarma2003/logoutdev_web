"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { createReply, deletePost, submitPollVote } from "@/lib/api";
import type { Post, PollOptionItem, PostHashtagEntity, PostMentionEntity, User } from "@/lib/types";
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
          style={{ color: "#1d9bf0" }}
          className="hover:underline"
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
          style={{ color: "#1d9bf0" }}
          className="hover:underline"
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

function PollCard({
  post,
  currentUser,
  onUpdate,
  clickable,
}: {
  post: Post;
  currentUser: User;
  onUpdate: (updated: Post) => void;
  clickable: boolean;
}) {
  const [voting, setVoting] = useState(false);
  const isOwn = post.user_id === currentUser.id;
  const options = post.poll_options ?? [];
  const hasVoted = post.poll_voted_by_me ?? false;
  const totalVotes = post.poll_total_votes ?? 0;

  const handleVote = async (e: React.MouseEvent, option: PollOptionItem) => {
    e.stopPropagation();
    if (voting || isOwn) return;
    setVoting(true);
    try {
      const res = await submitPollVote(post.id, option.id);
      const votedOptionId = res.option_id;
      const newTotalVotes = res.voted
        ? (option.voted_by_me ? totalVotes : totalVotes + 1)
        : totalVotes - 1;

      const updatedOptions = options.map((opt) => {
        const wasVoted = opt.voted_by_me;
        const isNowVoted = opt.id === votedOptionId && res.voted;
        let newCount = opt.vote_count;
        if (wasVoted && !isNowVoted) newCount = Math.max(0, newCount - 1);
        if (!wasVoted && isNowVoted) newCount = newCount + 1;
        const total = newTotalVotes > 0 ? newTotalVotes : 1;
        return {
          ...opt,
          vote_count: newCount,
          vote_percent: Math.round((newCount / total) * 100),
          voted_by_me: isNowVoted,
        };
      });

      onUpdate({
        ...post,
        poll_options: updatedOptions,
        poll_total_votes: newTotalVotes,
        poll_voted_by_me: res.voted,
      });
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3">
      {options.map((option) => {
        const showResults = hasVoted || isOwn;
        return (
          <div key={option.id}>
            {showResults ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`text-sm ${option.voted_by_me ? "font-semibold text-white" : "text-zinc-300"}`}>
                    {option.text}
                    {option.voted_by_me && (
                      <span className="ml-2 text-[11px] font-medium text-sky-400">Your vote</span>
                    )}
                  </span>
                  <span className="tabular-nums text-zinc-500">{option.vote_percent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all ${option.voted_by_me ? "bg-sky-400" : "bg-zinc-500"}`}
                    style={{ width: `${option.vote_percent}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={voting}
                onClick={(e) => handleVote(e, option)}
                className="w-full rounded-xl border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-wait"
              >
                {option.text}
              </button>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-zinc-600">
        {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        {isOwn ? " · You can't vote on your own poll" : ""}
      </p>
    </div>
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

  const isOwn = post.user_id === currentUser.id;

  const handleCardClick = () => {
    if (clickable) router.push(`/post/${post.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      onDelete(post.id);
    } finally {
      setIsDeleting(false);
      setMenuOpen(false);
    }
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

          {post.is_poll && post.poll_options && post.poll_options.length > 0 ? (
            <PollCard
              post={post}
              currentUser={currentUser}
              onUpdate={onUpdate}
              clickable={clickable}
            />
          ) : null}

          {post.linked_entity ? (
            <div className="mt-3">
              <LinkedEntityCard entity={post.linked_entity} compact />
            </div>
          ) : null}

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
            onSubmit={async (content) => {
              const res = await createReply(post.id, content);
              onUpdate({ ...post, reply_count: (post.reply_count ?? 0) + 1 });
              return res.reply;
            }}
            onPostCreated={() => setReplyOpen(false)}
          />
        </div>
      )}
    </article>
  );
}
