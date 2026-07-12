import type { HiringOffer, HiringOfferStatus } from "@/lib/services/opportunitiesApi";

const actionableStatuses = new Set<HiringOfferStatus>(["sent", "viewed"]);

type OfferOutcomeSummary = {
  company_reported_hired_at: string | null;
  developer_confirmed_hired_at: string | null;
  developer_disputed_at: string | null;
};

export function offerStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function offerCanRespond(offer: Pick<HiringOffer, "status" | "expires_at">, at = Date.now()) {
  return actionableStatuses.has(offer.status) && new Date(offer.expires_at).getTime() > at;
}

export function offerNeedsOutcomeConfirmation(offer: {
  status: HiringOfferStatus;
  outcome_confirmation: OfferOutcomeSummary | null;
}) {
  const outcome = offer.outcome_confirmation;
  return offer.status === "accepted"
    && Boolean(outcome?.company_reported_hired_at)
    && !outcome?.developer_confirmed_hired_at
    && !outcome?.developer_disputed_at;
}

export function offerSelectionId(offers: Array<Pick<HiringOffer, "id">>, preferredId = "") {
  return preferredId || offers[0]?.id || "";
}

export function offerCompensation(offer: {
  compensation_currency: string;
  compensation_min: string;
  compensation_max: string | null;
  compensation_period: string;
}) {
  const range = offer.compensation_max
    ? `${offer.compensation_min} - ${offer.compensation_max}`
    : offer.compensation_min;
  return `${offer.compensation_currency} ${range} / ${offerStatusLabel(offer.compensation_period)}`;
}
