"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { getRichTextTokens } from "@/lib/richText";

const TOKEN_COLOR = "#1d9bf0";

export function renderRichTextFragments(
  text: string,
  renderToken?: (token: ReturnType<typeof getRichTextTokens>[number], raw: string, index: number) => ReactNode
): ReactNode[] {
  const tokens = getRichTextTokens(text);
  const fragments: ReactNode[] = [];
  let cursor = 0;

  tokens.forEach((token, index) => {
    if (token.start < cursor || token.end > text.length || token.start >= token.end) return;

    if (token.start > cursor) {
      fragments.push(<Fragment key={`text:${cursor}`}>{text.slice(cursor, token.start)}</Fragment>);
    }

    const raw = text.slice(token.start, token.end);
    fragments.push(
      renderToken ? (
        <Fragment key={`token:${token.start}`}>{renderToken(token, raw, index)}</Fragment>
      ) : (
        <span key={`token:${token.start}`} style={{ color: TOKEN_COLOR }}>
          {raw}
        </span>
      )
    );

    cursor = token.end;
  });

  if (cursor < text.length) {
    fragments.push(<Fragment key={`tail:${cursor}`}>{text.slice(cursor)}</Fragment>);
  }

  return fragments.length > 0 ? fragments : [<Fragment key="text">{text}</Fragment>];
}

export default function RichText({
  text,
  className,
  clickable = true,
  onTokenClick,
  as = "p",
}: {
  text: string;
  className?: string;
  clickable?: boolean;
  onTokenClick?: (event: React.MouseEvent) => void;
  as?: "p" | "div" | "span";
}) {
  const content = renderRichTextFragments(text, (token, raw) => {
    if (!clickable) {
      return <span style={{ color: TOKEN_COLOR }}>{raw}</span>;
    }

    return (
      <Link
        href={token.href}
        onClick={onTokenClick}
        className="transition-opacity hover:underline"
        style={{ color: TOKEN_COLOR }}
      >
        {raw}
      </Link>
    );
  });

  const Component = as;
  return <Component className={className}>{content}</Component>;
}
