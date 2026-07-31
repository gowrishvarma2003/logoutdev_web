import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LeetcodeProfileCard from "./LeetcodeProfileCard";

describe("LeetcodeProfileCard", () => {
  it("renders solved counts, rating, and public ranks", () => {
    render(<LeetcodeProfileCard snapshot={{
      leetcode_username: "code_user", total_solved: 100, easy_solved: 30, medium_solved: 60, hard_solved: 10,
      profile_ranking: 1234, contest_rating: 1800.125, contest_global_ranking: 3000,
      attended_contests_count: 8, contest_top_percentage: 4.2, fetched_at: "2026-07-22T00:00:00.000Z",
    }} />);

    expect(screen.getByText("LeetCode")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("1800")).toBeInTheDocument();
    expect(screen.getByText("#1,234")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText(/8 contests attended · top 4.2%/)).toBeInTheDocument();
  });
});
