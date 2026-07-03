import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ActivityHeatmap from "./ActivityHeatmap";
import type { ProfileHeatmap } from "@/lib/types";

function makeBucket(date: string, total: number, by_type: Record<string, number> = {}) {
  return { date, total, by_type };
}

const baseHeatmap: ProfileHeatmap = {
  username: "deepak",
  user_id: "u1",
  range: { start: "2026-06-27", end: "2026-07-03" },
  days: 7,
  buckets: [
    makeBucket("2026-06-27", 0),
    makeBucket("2026-06-28", 2, { post: 2 }),
    makeBucket("2026-06-29", 0),
    makeBucket("2026-06-30", 1, { launch: 1 }),
    makeBucket("2026-07-01", 3, { post: 1, pr_opened: 1, message: 1 }),
    makeBucket("2026-07-02", 0),
    makeBucket("2026-07-03", 1, { post: 1 }),
  ],
  totals: { post: 4, launch: 1, pr_opened: 1, message: 1 },
  max_day_count: 3,
  active_days: 4,
  current_streak: 1,
  longest_streak: 2,
  types: ["launch", "message", "post", "pr_opened"],
};

describe("ActivityHeatmap", () => {
  it("renders the contribution summary and streak stats", () => {
    render(<ActivityHeatmap heatmap={baseHeatmap} loading={false} />);

    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText(/7 contributions in the last 7 days/)).toBeInTheDocument();
    expect(screen.getByText("Active days")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Current streak")).toBeInTheDocument();
    expect(screen.getByText("1d")).toBeInTheDocument();
    expect(screen.getByText("Longest streak")).toBeInTheDocument();
    expect(screen.getByText("2d")).toBeInTheDocument();
  });

  it("renders the less/more legend and a type breakdown", () => {
    render(<ActivityHeatmap heatmap={baseHeatmap} loading={false} />);

    expect(screen.getByText("Less")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
    expect(screen.getByText("Posts · 4")).toBeInTheDocument();
    expect(screen.getByText("Launches · 1")).toBeInTheDocument();
    expect(screen.getByText("Pull requests · 1")).toBeInTheDocument();
  });

  it("shows an empty state when there is no heatmap and not loading", () => {
    render(<ActivityHeatmap heatmap={null} loading={false} />);
    expect(screen.getByText("No activity yet")).toBeInTheDocument();
    expect(screen.queryByText("Activity")).toBeInTheDocument();
  });

  it("renders a loading skeleton when loading is true", () => {
    const { container } = render(<ActivityHeatmap heatmap={null} loading={true} />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
