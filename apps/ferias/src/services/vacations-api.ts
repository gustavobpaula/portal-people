import { z } from "zod";
import {
  availableVacationEligibility,
  VACATION_PROTOCOL,
} from "../domain/vacation-fixtures";
import {
  calculateEndDate,
  createVacationRequestSchema,
  vacationEligibilitySchema,
  vacationRequestSchema,
  type VacationEligibility,
  type VacationRequestInput,
} from "../domain/vacation-rules";

const vacationSubmissionSchema = vacationRequestSchema.extend({
  endDate: z.string(),
  protocol: z.string().min(1),
  status: z.literal("submitted"),
});

export type VacationSubmission = z.infer<typeof vacationSubmissionSchema>;

export class VacationsApiError extends Error {
  constructor(
    readonly kind: "http" | "invalid-response" | "network" | "validation",
  ) {
    super("Vacations API request failed.");
  }
}

export type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  fetcher: Fetcher,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetcher(path, {
      headers: { Accept: "application/json", ...init?.headers },
      ...init,
    });
  } catch {
    throw new VacationsApiError("network");
  }
  if (response.status === 422) throw new VacationsApiError("validation");
  if (!response.ok) throw new VacationsApiError("http");
  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success) throw new VacationsApiError("invalid-response");
  return parsed.data;
}

export interface VacationsApiClient {
  getEligibility(signal?: AbortSignal): Promise<VacationEligibility>;
  submitRequest(
    request: VacationRequestInput,
    signal?: AbortSignal,
  ): Promise<VacationSubmission>;
}

export function createVacationsApiClient(fetcher: Fetcher): VacationsApiClient {
  return {
    getEligibility: (signal) =>
      request(
        "/api/vacations/eligibility",
        vacationEligibilitySchema,
        fetcher,
        {
          signal,
        },
      ),
    submitRequest: (vacationRequest, signal) =>
      request("/api/vacations/requests", vacationSubmissionSchema, fetcher, {
        method: "POST",
        body: JSON.stringify(vacationRequest),
        headers: { "Content-Type": "application/json" },
        signal,
      }),
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Local deterministic client used by the standalone and federated demo. */
export const localVacationsFetch: Fetcher = async (input, init) => {
  if (init?.signal?.aborted)
    throw new DOMException("Request aborted", "AbortError");
  const url = new URL(
    typeof input === "string" ? input : input.toString(),
    "http://vacations.local",
  );
  if (url.pathname === "/api/vacations/eligibility" && !init?.method)
    return json(availableVacationEligibility);
  if (url.pathname !== "/api/vacations/requests" || init?.method !== "POST")
    return json({ message: "Not found" }, 404);

  let requestBody: unknown;
  try {
    requestBody = JSON.parse(String(init.body));
  } catch {
    return json({ message: "Invalid request" }, 422);
  }
  const parsed = createVacationRequestSchema(
    availableVacationEligibility,
  ).safeParse(requestBody);
  if (!parsed.success) return json({ message: "Invalid request" }, 422);
  return json({
    ...parsed.data,
    endDate: calculateEndDate(parsed.data.startDate, parsed.data.days),
    protocol: VACATION_PROTOCOL,
    status: "submitted",
  });
};

export const vacationsApiClient = createVacationsApiClient(localVacationsFetch);
