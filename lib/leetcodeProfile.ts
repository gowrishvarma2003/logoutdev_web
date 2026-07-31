const LEETCODE_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9_-]{0,48}[a-zA-Z0-9])?$/;

export function normalizeLeetcodeUsername(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/^@+/, "");
}

export function isValidLeetcodeUsername(value: string): boolean {
  return !value || LEETCODE_USERNAME_REGEX.test(value);
}
