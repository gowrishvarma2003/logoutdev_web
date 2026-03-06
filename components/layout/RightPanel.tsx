import type { User } from "@/lib/types";
import { emailToHandle } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";

interface RightPanelProps {
  currentUser: User;
}

const TRENDING_HASHTAGS = [
  { tag: "opensource", count: 142 },
  { tag: "typescript", count: 98 },
  { tag: "nextjs", count: 87 },
  { tag: "react", count: 76 },
  { tag: "devops", count: 64 },
  { tag: "ai", count: 59 },
];

export default function RightPanel({ currentUser }: RightPanelProps) {
  return (
    <div className="flex flex-col gap-6 p-4 pt-6">
      {/* Logged-in user mini card */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
        <Avatar user={currentUser} size="md" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {currentUser.name}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            @{emailToHandle(currentUser.email)}
          </p>
        </div>
      </div>

      {/* Trending hashtags */}
      <section>
        <h2 className="px-1 mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Trending topics
        </h2>
        <ul className="flex flex-col gap-0.5">
          {TRENDING_HASHTAGS.map(({ tag, count }) => (
            <li key={tag}>
              <button className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-800/60 transition-colors group">
                <p className="text-sm font-medium text-sky-400 group-hover:text-sky-300">
                  #{tag}
                </p>
                <p className="text-xs text-zinc-500">{count} posts</p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <p className="text-[11px] text-zinc-600 px-1 mt-auto">
        © {new Date().getFullYear()} LogoutDev
      </p>
    </div>
  );
}
