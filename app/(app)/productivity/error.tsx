"use client";

import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { PageContainer } from "@/components/ui/Page";

export default function ProductivityError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <PageContainer className="max-w-3xl">
      <EmptyState
        title="Productivity Hub could not load"
        description="Your work has not been changed. Try again, and return to the overview if the problem continues."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </PageContainer>
  );
}
