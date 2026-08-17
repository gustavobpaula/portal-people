import type { AvailableVacationEligibility } from "./vacation-rules";

export const availableVacationEligibility: AvailableVacationEligibility = {
  status: "available",
  availableDays: 20,
  eligiblePeriod: { startsOn: "2026-09-01", endsOn: "2027-08-31" },
};

export const balanceUnavailableEligibility = {
  status: "balance-unavailable",
} as const;

export const noEligibleDaysEligibility = {
  status: "no-eligible-days",
  availableDays: 0,
} as const;

export const VACATION_PROTOCOL = "FERIAS-2026-0001";
