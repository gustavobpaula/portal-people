import { z } from "zod";
import { benefitFixtures, benefitSummaries } from "./benefits-fixtures";

export const benefitSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  status: z.enum(["active", "available"]),
  summary: z.string().min(1),
});
export type BenefitSummary = z.infer<typeof benefitSummarySchema>;

export const benefitDetailSchema = benefitSummarySchema.extend({
  description: z.string().min(1),
  usageInstructions: z.string().min(1),
});
export type BenefitDetail = z.infer<typeof benefitDetailSchema>;

const benefitsResponseSchema = z.object({
  items: z.array(benefitSummarySchema),
});

export class BenefitsApiError extends Error {
  constructor(
    readonly kind: "http" | "invalid-response" | "network" | "not-found",
  ) {
    super("Benefits API request failed.");
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
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;
  try {
    response = await fetcher(path, {
      headers: { Accept: "application/json" },
      signal,
    });
  } catch {
    throw new BenefitsApiError("network");
  }
  if (response.status === 404) throw new BenefitsApiError("not-found");
  if (!response.ok) throw new BenefitsApiError("http");
  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success) throw new BenefitsApiError("invalid-response");
  return parsed.data;
}

export interface BenefitsApiClient {
  getBenefits(signal?: AbortSignal): Promise<{ items: BenefitSummary[] }>;
  getBenefit(id: string, signal?: AbortSignal): Promise<BenefitDetail>;
}

export function createBenefitsApiClient(fetcher: Fetcher): BenefitsApiClient {
  return {
    getBenefits: (signal) =>
      request("/api/benefits", benefitsResponseSchema, fetcher, signal),
    getBenefit: (id, signal) =>
      request(
        `/api/benefits/${encodeURIComponent(id)}`,
        benefitDetailSchema,
        fetcher,
        signal,
      ),
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const localBenefitsFetch: Fetcher = async (input, init) => {
  if (init?.signal?.aborted)
    throw new DOMException("Request aborted", "AbortError");
  const path = new URL(
    typeof input === "string" ? input : input.toString(),
    "http://beneficios.local",
  ).pathname;
  if (path === "/api/benefits") {
    return json({ items: benefitSummaries });
  }
  const id = path.match(/^\/api\/benefits\/([^/]+)$/)?.[1];
  const benefit = id
    ? benefitFixtures.find((item) => item.id === decodeURIComponent(id))
    : undefined;
  return benefit ? json(benefit) : json({ message: "Not found" }, 404);
};

/** Local deterministic client used by the standalone and federated demo. */
export const benefitsApiClient = createBenefitsApiClient(localBenefitsFetch);
