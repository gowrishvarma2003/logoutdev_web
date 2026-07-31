/**
 * GitHub profile username helpers.
 * Profile storage remains `github_url` (https://github.com/{username});
 * the edit UI collects a username only.
 */

/** GitHub allows a–z, A–Z, 0–9, and hyphens; max 39; no leading/trailing hyphen. */
const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export function isValidGithubUsername(username: string): boolean {
  if (!username) return true;
  return GITHUB_USERNAME_REGEX.test(username);
}

/**
 * Extract a GitHub username from a stored URL, full profile link, or raw username.
 */
export function githubUsernameFromInput(value: string | null | undefined): string {
  if (!value) return "";
  let trimmed = value.trim();
  if (!trimmed) return "";

  trimmed = trimmed.replace(/^@+/, "");

  try {
    const withProtocol =
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed.replace(/^\/+/, "")}`;
    const url = new URL(withProtocol);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "github.com") {
      const segment = url.pathname.split("/").filter(Boolean)[0] || "";
      return segment;
    }
  } catch {
    // not a parseable URL — fall through
  }

  return trimmed
    .replace(/^(https?:\/\/)?(www\.)?github\.com\/?/i, "")
    .split(/[/?#]/)[0]
    .replace(/^@+/, "")
    .trim();
}

/**
 * Build a canonical profile URL from a username (or pasting a GitHub URL).
 * Returns empty string when input is empty/invalid-empty.
 */
export function githubUrlFromUsername(username: string | null | undefined): string {
  const extracted = githubUsernameFromInput(username);
  if (!extracted) return "";
  return `https://github.com/${extracted}`;
}
