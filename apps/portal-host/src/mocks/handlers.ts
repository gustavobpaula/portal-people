import { http, HttpResponse } from "msw";
import registry from "../assets/journey-registry.json";
import { catalogItems, notifications } from "./fixtures";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export const journeyRegistryHandler = http.get("/api/journeys", () =>
  HttpResponse.json(registry),
);

export const portalHandlers = [
  http.get("/api/portal/catalog", () =>
    HttpResponse.json({ items: catalogItems }),
  ),
  http.get("/api/portal/search", ({ request }) => {
    const query = normalize(new URL(request.url).searchParams.get("q") ?? "");
    const items = query
      ? catalogItems.filter((item) =>
          [item.title, item.description, ...item.keywords].some((value) =>
            normalize(value).includes(query),
          ),
        )
      : catalogItems;
    return HttpResponse.json({ items });
  }),
  http.get("/api/portal/notifications", () =>
    HttpResponse.json({ items: notifications }),
  ),
];

export const handlers = [journeyRegistryHandler, ...portalHandlers];
