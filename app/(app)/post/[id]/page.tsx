"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPost, getReplies } from "@/lib/api";
import { createReply } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";
import type { Post } from "@/lib/types";
import PostCard from "@/components/feed/PostCard";
import ComposeBox from "@/components/feed/ComposeBox";
import Spinner from "@/components/ui/Spinner";
import { ArrowLeftIcon } from "@/components/ui/Icons";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default function PostDetailPage({ params }: PostPageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const [postRes, repliesRes] = await Promise.all([
          getPost(id),
          getReplies(id),
        ]);
        setPost(postRes.post);
        setReplies(repliesRes.replies);
      } catch {
        setError("Could not load this post.");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [id]);

  if (!user) return null;

  return (
    <div>
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 -ml-1.5 rounded-full text-zinc-400 hover:bg-zinc-800 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-[17px] font-bold text-white">Post</h1>
      </header>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="py-16 text-center">
          <p className="text-sm text-zinc-500">{error}</p>
        </div>
      )}

      {/* ── Post + replies ── */}
      {!isLoading && post && (
        <>
          {/* Main post (non-clickable since we're on its page) */}
          <PostCard
            post={post}
            currentUser={user}
            onUpdate={setPost}
            onDelete={() => router.back()}
            clickable={false}
          />

          {/* Reply compose */}
          <div className="border-b border-zinc-800">
            <ComposeBox
              currentUser={user}
              placeholder="Write a reply…"
              onSubmit={async (content) => {
                const res = await createReply(post.id, content);
                return res.reply;
              }}
              onPostCreated={(reply) => {
                setReplies((prev) => [...prev, reply]);
                setPost((p) => p ? { ...p, reply_count: (p.reply_count ?? 0) + 1 } : p);
              }}
            />
          </div>

          {/* Replies */}
          {replies.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              No replies yet — start the conversation.
            </p>
          ) : (
            replies.map((reply) => (
              <PostCard
                key={reply.id}
                post={reply}
                currentUser={user}
                onUpdate={(updated) =>
                  setReplies((prev) =>
                    prev.map((r) => (r.id === updated.id ? updated : r))
                  )
                }
                onDelete={(rid) =>
                  setReplies((prev) => prev.filter((r) => r.id !== rid))
                }
              />
            ))
          )}
        </>
      )}
    </div>
  );
}
