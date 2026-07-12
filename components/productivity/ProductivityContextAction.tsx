"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useToast } from "@/lib/hooks/useToast";
import RichProductivityDialog from "./RichProductivityDialog";
import type { ProductivityComposePayload, ProductivityKind } from "@/lib/services/productivityApi";

type Relation = NonNullable<ProductivityComposePayload["relations"]>[number];

export default function ProductivityContextAction({
  title,
  description = "",
  relation,
  kind = "task",
  date = "",
  label = "Add to Productivity",
  size = "sm",
  variant = "ghost",
}: {
  title: string;
  description?: string;
  relation: Relation;
  kind?: ProductivityKind;
  date?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
}) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  return (
    <>
      <Button type="button" size={size} variant={variant} onClick={() => setOpen(true)}>{label}</Button>
      <RichProductivityDialog
        open={open}
        onClose={() => setOpen(false)}
        initialKind={kind}
        defaultTitle={title}
        defaultDescription={description}
        defaultDate={date}
        defaultRelation={relation}
        onCreated={() => { showToast("Added to Productivity", { description: "The source stays linked to this item." }); }}
      />
    </>
  );
}
