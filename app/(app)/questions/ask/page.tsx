"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import AskQuestionForm from "@/components/questions/AskQuestionForm";
import { ArrowLeftIcon } from "@/components/ui/Icons";

export default function AskQuestionPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return (
      <div className="px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
          <h1 className="text-xl font-semibold text-white">Sign in to ask a question</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Questions are public to browse, but only authenticated users can ask, answer, and join discussion.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100"
            >
              Sign in
            </Link>
            <Link
              href="/questions"
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-800"
            >
              Back to Questions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-white">Ask Question</h1>
          <p className="text-sm text-zinc-500">Open-ended or MCQ, with gated discussion.</p>
        </div>
      </header>

      <AskQuestionForm
        onCreated={(questionId, shareToFeed, questionTitle) => {
          if (shareToFeed && questionTitle) {
            const params = new URLSearchParams({
              shareType: "question",
              shareId: questionId,
              shareTitle: questionTitle,
              shareHref: `/questions/${questionId}`,
            });
            router.push(`/feed?${params.toString()}`);
          } else {
            router.push(`/questions/${questionId}`);
          }
        }}
      />
    </div>
  );
}
