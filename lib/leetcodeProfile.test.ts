import { describe, expect, it } from "vitest";
import { isValidLeetcodeUsername, normalizeLeetcodeUsername } from "./leetcodeProfile";

describe("LeetCode username helpers", () => {
  it("normalizes an optional leading @", () => {
    expect(normalizeLeetcodeUsername(" @code_user ")).toBe("code_user");
  });

  it("accepts valid LeetCode handles and rejects unsafe input", () => {
    expect(isValidLeetcodeUsername("code_user-1")).toBe(true);
    expect(isValidLeetcodeUsername("has space")).toBe(false);
    expect(isValidLeetcodeUsername("https://leetcode.com/u/user")).toBe(false);
  });
});
