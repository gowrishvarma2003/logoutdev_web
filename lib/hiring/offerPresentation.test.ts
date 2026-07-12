import { describe, expect, it } from "vitest";
import {
  offerCanRespond,
  offerCompensation,
  offerNeedsOutcomeConfirmation,
  offerSelectionId,
} from "./offerPresentation";

describe("offer presentation", () => {
  it("allows responses only for live sent or viewed offers", () => {
    const future = "2030-01-01T00:00:00.000Z";
    expect(offerCanRespond({ status: "sent", expires_at: future }, 0)).toBe(true);
    expect(offerCanRespond({ status: "viewed", expires_at: future }, 0)).toBe(true);
    expect(offerCanRespond({ status: "accepted", expires_at: future }, 0)).toBe(false);
    expect(offerCanRespond({ status: "sent", expires_at: "2020-01-01T00:00:00.000Z" }, Date.now())).toBe(false);
  });

  it("requires a separate developer confirmation after the company reports a hire", () => {
    const pending = {
      company_reported_hired_at: "2026-07-12T10:00:00.000Z",
      developer_confirmed_hired_at: null,
      developer_disputed_at: null,
    };
    expect(offerNeedsOutcomeConfirmation({ status: "accepted", outcome_confirmation: pending })).toBe(true);
    expect(offerNeedsOutcomeConfirmation({ status: "viewed", outcome_confirmation: pending })).toBe(false);
    expect(offerNeedsOutcomeConfirmation({ status: "accepted", outcome_confirmation: { ...pending, developer_confirmed_hired_at: "2026-07-12T11:00:00.000Z" } })).toBe(false);
  });

  it("keeps deep links stable and formats structured compensation", () => {
    expect(offerSelectionId([{ id: "newest" }], "linked")).toBe("linked");
    expect(offerSelectionId([{ id: "newest" }])).toBe("newest");
    expect(offerCompensation({ compensation_currency: "USD", compensation_min: "120000", compensation_max: "150000", compensation_period: "annual" })).toBe("USD 120000 - 150000 / annual");
  });
});
