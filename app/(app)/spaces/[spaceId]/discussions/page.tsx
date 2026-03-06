"use client";

  

const CATEGORIES: DiscussionCategory[] = [
  "idea", "question", "decision", "blocked", "retrospective",
];


/**
 * /spaces/[spaceId]/discussions
 * Twitter-like feed behavior:
 * - Show only top-level discussion posts.
 * - Clicking any post opens its thread page where replies are shown.
 */
export default function DiscussionsPage({
  params,
}: {
  params: Promise<{ spaceId: string }>;
}) {
  const { spaceId } = use(params);
  const { user } = useAuth();
  const { contributors } = useContributors(spaceId);
  const isMember = contributors.some((c) => c.user_id === user?.id);

  const [page, setPage] = useState(1);
  const { discussions, total, loading, error, refetch } = useDiscussions(spaceId, page);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<DiscussionCategory>("idea");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setPosting(true);
    setPostError("");
    try {
      await api.createDiscussion(spaceId, {
        title: title.trim(),
        body: body.trim(),
        category,
      });
      setTitle("");
      setBody("");
      setCategory("idea");
      refetch();
    } catch (err: unknown) {
      setPostError(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="px-5 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <ChatBubbleIcon className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-white">Discussions</h2>
          {total > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-400">
              {total}
            </span>
          )}
        </div>
      </div>

      {isMember && (
        <form onSubmit={handlePost} className="px-5 py-4 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex items-start gap-3">
            <Avatar user={user} size="sm" className="mt-1" />
            <div className="flex-1 space-y-2.5">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Discussion title"
                maxLength={180}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Share your idea..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none transition-colors"
              />
              <div className="flex items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DiscussionCategory)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-600"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="flex-1" />
                {postError && <span className="text-xs text-rose-400">{postError}</span>}
                <button
                  type="submit"
                  disabled={posting || !title.trim() || !body.trim()}
                  className="px-4 py-1.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {error && <p className="text-sm text-rose-400 text-center py-10">{error}</p>}

      {!loading && !error && discussions.length === 0 && (
        <EmptyState
          icon={<ChatBubbleIcon className="w-10 h-10" />}
          title="No discussions yet"
          description={isMember ? "Post the first idea for this space." : "No discussions have been started yet."}
        />
      )}

      {!loading && !error && discussions.length > 0 && (
        <div>
          {discussions.map((discussion) => (
            <DiscussionThreadCard key={discussion.id} discussion={discussion} spaceId={spaceId} />
          ))}
        </div>
      )}

      {(page > 1 || discussions.length >= 20) && (
        <div className="flex items-center justify-center gap-3 py-5 border-t border-zinc-800/60">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-white">{page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={discussions.length < 20}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
