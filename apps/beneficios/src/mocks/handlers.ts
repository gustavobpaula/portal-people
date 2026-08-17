import { http, HttpResponse } from "msw";
import { benefitFixtures, benefitSummaries } from "../benefits-fixtures";

const API_BASE_URL = "http://localhost/api/beneficios";

export const handlers = [
  http.get(API_BASE_URL, () => HttpResponse.json({ items: benefitSummaries })),
  http.get(`${API_BASE_URL}/:id`, ({ params }) => {
    const benefit = benefitFixtures.find((item) => item.id === params.id);
    return benefit
      ? HttpResponse.json(benefit)
      : HttpResponse.json({ message: "Not found" }, { status: 404 });
  }),
];
