"use client";

import type { RelatedEntityRef } from "@/lib/types";
import LinkedEntityCard from "./LinkedEntityCard";

export default function RelatedEntitiesPanel({
  items,
  title = "Related across LogoutDev",
}: {
  items: RelatedEntityRef[];
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <div key={`${item.type}:${item.id}`}>
            <LinkedEntityCard entity={item} compact />
            {item.reason ? (
              <p className="mt-1 px-1 text-xs leading-5 text-zinc-500">{item.reason}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
