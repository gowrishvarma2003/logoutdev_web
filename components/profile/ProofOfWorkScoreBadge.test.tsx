import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProofOfWorkScoreBadge from "./ProofOfWorkScoreBadge";
import type { ProofOfWorkSignals } from "@/lib/types";

const signals: ProofOfWorkSignals = {
  version: "v3",
  score_version: "v3",
  score_timezone: "Asia/Kolkata",
  score: 1240,
  band: "Strong",
  badge: "Gold",
  peak_badge: "Gold",
  factors: {
    code_delivery: 500,
    project_execution: 260,
    collaboration: 180,
    knowledge_sharing: 150,
    reliability_outcomes: 120,
    community_contribution: 30,
  },
  category_totals: {
    code_delivery: 500,
    project_execution: 260,
    collaboration: 180,
    knowledge_sharing: 150,
    reliability_outcomes: 120,
    community_contribution: 30,
  },
  next_badge: {
    name: "Platinum",
    threshold: 2500,
    points_needed: 1260,
    gate_categories: 4,
    gate_points: 250,
    gate_categories_met: 2,
    blockers: [{ type: "category_diversity", categories_needed: 2, gate_points: 250 }],
  },
  last_scored_date: "2026-07-05",
  owner_details: {
    recent_daily_ledgers: [{
      score_date: "2026-07-05",
      raw_points: 42,
      capped_points: 38,
      positive_points: 38,
      final_points: 38,
      penalties: { inactivity: 0, quality: 0, abuse: 0 },
      categories: { code_delivery: 20 },
      events_count: 8,
      meaningful_activity_count: 6,
    }],
  },
};

describe("ProofOfWorkScoreBadge", () => {
  it("renders an uncapped XP score and badge without /100", () => {
    render(<ProofOfWorkScoreBadge signals={signals} />);

    expect(screen.getByText(/Gold/)).toBeInTheDocument();
    expect(screen.getByText(/1,240 XP/)).toBeInTheDocument();
    expect(screen.queryByText(/\/100/)).not.toBeInTheDocument();
    expect(screen.getByText(/Next: Platinum/)).toBeInTheDocument();
  });

  it("shows category totals and owner ledger when expanded", () => {
    render(<ProofOfWorkScoreBadge signals={signals} />);

    fireEvent.click(screen.getByRole("button", { name: /toggle proof-of-work details/i }));

    expect(screen.getByText("Code Delivery")).toBeInTheDocument();
    expect(screen.getByText("Recent ledger")).toBeInTheDocument();
    expect(screen.getAllByText("2026-07-05").length).toBeGreaterThan(0);
    expect(screen.getByText("+38")).toBeInTheDocument();
    expect(screen.getByText("Raw")).toBeInTheDocument();
    expect(screen.getByText("Capped")).toBeInTheDocument();
    expect(screen.getByText("-4")).toBeInTheDocument();
  });
});
