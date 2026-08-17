import { http, HttpResponse } from "msw";
import {
  availableVacationEligibility,
  VACATION_PROTOCOL,
} from "../services/api/vacation-fixtures";
import {
  calculateEndDate,
  createVacationRequestSchema,
} from "../domain/vacation-rules";

const API_BASE_URL = "http://localhost/api/vacations";

export const handlers = [
  http.get(`${API_BASE_URL}/eligibility`, () =>
    HttpResponse.json(availableVacationEligibility),
  ),
  http.post(`${API_BASE_URL}/requests`, async ({ request }) => {
    const body = await request.json().catch(() => undefined);
    const parsed = createVacationRequestSchema(
      availableVacationEligibility,
    ).safeParse(body);
    if (!parsed.success)
      return HttpResponse.json({ message: "Invalid request" }, { status: 422 });
    return HttpResponse.json({
      ...parsed.data,
      endDate: calculateEndDate(parsed.data.startDate, parsed.data.days),
      protocol: VACATION_PROTOCOL,
      status: "submitted",
    });
  }),
];
