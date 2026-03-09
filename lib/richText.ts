export type RichTextTokenType = "hashtag" | "mention";

export interface RichTextToken {
  type: RichTextTokenType;
  raw: string;
  value: string;
  normalizedValue: string;
  href: string;
  start: number;
  end: number;
}

export interface ActiveRichToken {
  type: RichTextTokenType;
  query: string;
  start: number;
  end: number;
}

const RICH_TEXT_TOKEN_REGEX = /(^|\s)([#@][A-Za-z0-9_]+)/g;

export function getRichTextTokenHref(type: RichTextTokenType, value: string): string {
  return type === "hashtag"
    ? `/hashtags/${value.toLowerCase()}`
    : `/profile/${value}`;
}

export function getRichTextTokens(text: string): RichTextToken[] {
  const tokens: RichTextToken[] = [];

  for (const match of text.matchAll(RICH_TEXT_TOKEN_REGEX)) {
    const prefix = match[1] ?? "";
    const raw = match[2] ?? "";
    const matchIndex = match.index ?? 0;
    const start = matchIndex + prefix.length;
    const end = start + raw.length;
    const value = raw.slice(1);
    const type: RichTextTokenType = raw.startsWith("#") ? "hashtag" : "mention";
    const normalizedValue = type === "hashtag" ? value.toLowerCase() : value;

    tokens.push({
      type,
      raw,
      value,
      normalizedValue,
      href: getRichTextTokenHref(type, normalizedValue),
      start,
      end,
    });
  }

  return tokens;
}

export function findActiveRichToken(
  value: string,
  caret: number,
  minQueryLength = 2
): ActiveRichToken | null {
  const beforeCaret = value.slice(0, caret);
  const match = beforeCaret.match(/(?:^|\s)([#@])([A-Za-z0-9_]*)$/);
  if (!match) return null;
  if (match[2].length < minQueryLength) return null;

  const fullMatch = match[0];
  const start = beforeCaret.length - fullMatch.length + fullMatch.lastIndexOf(match[1]);

  return {
    type: match[1] === "#" ? "hashtag" : "mention",
    query: match[2].toLowerCase(),
    start,
    end: caret,
  };
}

export function escapeRichTextHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildRichTextHtml(text: string, clickable = true): string {
  const tokens = getRichTextTokens(text);
  let html = "";
  let cursor = 0;

  for (const token of tokens) {
    if (token.start > cursor) {
      html += escapeRichTextHtml(text.slice(cursor, token.start));
    }

    const raw = escapeRichTextHtml(text.slice(token.start, token.end));
    const href = escapeRichTextHtml(token.href);
    const openTag = clickable
      ? `<a data-rich-token="true" href="${href}" style="color:#1d9bf0;text-decoration:none;">`
      : `<span data-rich-token="true" style="color:#1d9bf0;">`;
    const closeTag = clickable ? "</a>" : "</span>";

    html += `${openTag}${raw}${closeTag}`;
    cursor = token.end;
  }

  if (cursor < text.length) {
    html += escapeRichTextHtml(text.slice(cursor));
  }

  return html;
}
