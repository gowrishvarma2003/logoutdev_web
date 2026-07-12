import type { AcceptedOpportunity, AcceptedOpportunityStatus } from "@/lib/services/opportunitiesApi";

export const acceptedOpportunitySteps: AcceptedOpportunityStatus[] = [
  "accepted",
  "in_conversation",
  "technical_review",
  "team_review",
  "company_interested",
  "closed",
];

export function opportunityStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function acceptedOpportunityCanAct(opportunity: Pick<AcceptedOpportunity, "process_state">) {
  return opportunity.process_state === "active";
}

export function acceptedOpportunitySelectionId(
  opportunities: Array<Pick<AcceptedOpportunity, "id">>,
  preferredId = "",
) {
  return preferredId || opportunities[0]?.id || "";
}

export function completedOpportunitySteps(status: AcceptedOpportunityStatus) {
  const index = acceptedOpportunitySteps.indexOf(status);
  return new Set(acceptedOpportunitySteps.slice(0, Math.max(0, index) + 1));
}
