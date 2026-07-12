import { describe, expect, it } from "vitest";
import {
  acceptedOpportunityCanAct,
  acceptedOpportunitySelectionId,
  completedOpportunitySteps,
} from "./acceptedOpportunityPresentation";

describe("accepted opportunity presentation", () => {
  it("shows only the simplified developer-visible progression", () => {
    expect([...completedOpportunitySteps("technical_review")]).toEqual([
      "accepted",
      "in_conversation",
      "technical_review",
    ]);
  });

  it("locks developer process actions outside an active process", () => {
    expect(acceptedOpportunityCanAct({ process_state: "active" })).toBe(true);
    expect(acceptedOpportunityCanAct({ process_state: "reported" })).toBe(false);
    expect(acceptedOpportunityCanAct({ process_state: "closed" })).toBe(false);
  });

  it("preserves an explicit deep link outside the first page", () => {
    expect(acceptedOpportunitySelectionId([{ id: "first-page-item" }], "older-linked-item")).toBe("older-linked-item");
    expect(acceptedOpportunitySelectionId([{ id: "first-page-item" }])).toBe("first-page-item");
  });
});
