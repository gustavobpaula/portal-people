import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(value: string) {
  if (!ISO_DATE.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const isoDateSchema = z
  .string()
  .refine(isCalendarDate, "Informe uma data válida.");

export const vacationRequestSchema = z.object({
  startDate: isoDateSchema,
  days: z
    .number({ error: "Informe a quantidade de dias." })
    .int("A quantidade deve ser um número inteiro.")
    .positive("A quantidade deve ser maior que zero."),
});

export type VacationRequestInput = z.infer<typeof vacationRequestSchema>;

export const eligiblePeriodSchema = z.object({
  startsOn: isoDateSchema,
  endsOn: isoDateSchema,
});

export const vacationEligibilitySchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("available"),
    availableDays: z.number().int().positive(),
    eligiblePeriod: eligiblePeriodSchema,
  }),
  z.object({ status: z.literal("balance-unavailable") }),
  z.object({
    status: z.literal("no-eligible-days"),
    availableDays: z.literal(0),
  }),
]);

export type VacationEligibility = z.infer<typeof vacationEligibilitySchema>;
export type AvailableVacationEligibility = Extract<
  VacationEligibility,
  { status: "available" }
>;

export function addCalendarDays(startDate: string, days: number) {
  const date = new Date(`${startDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** The start date is included in the requested number of calendar days. */
export function calculateEndDate(startDate: string, days: number) {
  return addCalendarDays(startDate, days - 1);
}

export function createVacationRequestSchema(
  eligibility: AvailableVacationEligibility,
) {
  return vacationRequestSchema.superRefine((request, context) => {
    if (request.days > eligibility.availableDays) {
      context.addIssue({
        code: "custom",
        path: ["days"],
        message: "A quantidade não pode ser maior que o saldo disponível.",
      });
    }
    const endDate = calculateEndDate(request.startDate, request.days);
    if (
      request.startDate < eligibility.eligiblePeriod.startsOn ||
      endDate > eligibility.eligiblePeriod.endsOn
    ) {
      context.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "O período solicitado deve estar dentro do período elegível.",
      });
    }
  });
}
