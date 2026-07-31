import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GithubContributionCard from "./GithubContributionCard";

describe("GithubContributionCard", () => {
  it("renders the public repository count and per-day GitHub contributions", () => {
    render(
      <GithubContributionCard
        snapshot={{
          github_username: "octocat",
          public_repos_count: 8,
          fetched_at: "2026-07-19T10:00:00.000Z",
          daily_contributions: [
            { date: "2026-07-01", count: 2 },
            { date: "2026-07-02", count: 0 },
          ],
        }}
      />
    );

    expect(screen.getByText("GitHub activity")).toBeInTheDocument();
    expect(screen.getByText("8 public repos")).toBeInTheDocument();
    expect(screen.getByText(/2 contributions from GitHub/)).toBeInTheDocument();
    expect(screen.getByLabelText(/2 GitHub contributions on Jul 1, 2026/)).toBeInTheDocument();
  });
});
