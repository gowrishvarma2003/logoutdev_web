import { describe, expect, it } from "vitest";
import {
  githubUrlFromUsername,
  githubUsernameFromInput,
  isValidGithubUsername,
} from "./githubProfile";

describe("githubUsernameFromInput", () => {
  it("returns empty for empty input", () => {
    expect(githubUsernameFromInput("")).toBe("");
    expect(githubUsernameFromInput(null)).toBe("");
    expect(githubUsernameFromInput(undefined)).toBe("");
  });

  it("extracts username from profile URLs", () => {
    expect(githubUsernameFromInput("https://github.com/octocat")).toBe("octocat");
    expect(githubUsernameFromInput("https://www.github.com/octocat/")).toBe("octocat");
    expect(githubUsernameFromInput("github.com/octocat")).toBe("octocat");
    expect(githubUsernameFromInput("https://github.com/octocat?tab=repositories")).toBe("octocat");
  });

  it("accepts bare usernames and @handles", () => {
    expect(githubUsernameFromInput("octocat")).toBe("octocat");
    expect(githubUsernameFromInput("@octocat")).toBe("octocat");
  });
});

describe("githubUrlFromUsername", () => {
  it("builds canonical profile URL", () => {
    expect(githubUrlFromUsername("octocat")).toBe("https://github.com/octocat");
    expect(githubUrlFromUsername("@octocat")).toBe("https://github.com/octocat");
    expect(githubUrlFromUsername("https://github.com/octocat")).toBe("https://github.com/octocat");
  });

  it("returns empty when no username", () => {
    expect(githubUrlFromUsername("")).toBe("");
    expect(githubUrlFromUsername("   ")).toBe("");
  });
});

describe("isValidGithubUsername", () => {
  it("allows valid usernames", () => {
    expect(isValidGithubUsername("")).toBe(true);
    expect(isValidGithubUsername("a")).toBe(true);
    expect(isValidGithubUsername("octocat")).toBe(true);
    expect(isValidGithubUsername("some-user-1")).toBe(true);
  });

  it("rejects invalid usernames", () => {
    expect(isValidGithubUsername("-bad")).toBe(false);
    expect(isValidGithubUsername("bad-")).toBe(false);
    expect(isValidGithubUsername("has space")).toBe(false);
    expect(isValidGithubUsername("has_underscore")).toBe(false);
  });
});
