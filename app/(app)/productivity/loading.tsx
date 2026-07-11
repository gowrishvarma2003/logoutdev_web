import { PageContainer } from "@/components/ui/Page";
import Skeleton from "@/components/ui/Skeleton";

export default function ProductivityLoading() {
  return (
    <PageContainer className="max-w-6xl space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </PageContainer>
  );
}
