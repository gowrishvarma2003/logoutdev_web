/**
 * ProfileSkeleton — loading placeholder matching the profile card recipes.
 */

const SKELETON = "animate-pulse rounded-xl bg-surface-hover/70";

export function ProfileOverviewSkeleton() {
  return (
    <div className="px-5 py-6 space-y-6">
      <div className={`${SKELETON} h-28`} />
      <div className="space-y-2.5">
        <div className={`${SKELETON} h-4 w-1/3`} />
        <div className={`${SKELETON} h-4 w-2/3`} />
        <div className={`${SKELETON} h-4 w-1/2`} />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className={`${SKELETON} h-16`} />
        <div className={`${SKELETON} h-16`} />
        <div className={`${SKELETON} h-16`} />
        <div className={`${SKELETON} h-16`} />
      </div>
    </div>
  );
}

export function ProfileListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-5 py-4 border-b border-border-subtle">
          <div className={`${SKELETON} w-10 h-10 rounded-xl shrink-0`} />
          <div className="flex-1 space-y-2">
            <div className={`${SKELETON} h-4 w-1/2`} />
            <div className={`${SKELETON} h-3 w-3/4`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileCardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-4 px-5 py-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className={`${SKELETON} h-44`} />
      ))}
    </div>
  );
}

export default ProfileOverviewSkeleton;
