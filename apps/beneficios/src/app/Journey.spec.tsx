import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlatformCapabilities } from "@portal/platform-contracts";
import {
  createBenefitsApiClient,
  type BenefitsApiClient,
} from "../services/api/benefits-api";
import { BenefitsApp } from "./Journey";
import { server } from "../mocks/server";

const track = vi.fn();
const API_BASE_URL = "http://localhost/api/benefits";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function RoutedBenefitsApp({ client }: { client?: BenefitsApiClient }) {
  const navigate = useNavigate();
  const platform: PlatformCapabilities = {
    navigate,
    context: {
      correlationId: "beneficios-correlation",
      locale: "pt-BR",
      platform: "web",
    },
    telemetry: { track },
    flags: {},
    notifications: { show: () => undefined },
    device: { isAvailable: () => false },
  };
  return <BenefitsApp client={client} platform={platform} />;
}

const httpFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(new URL(input.toString(), "http://localhost").toString(), init);

function renderBenefits(
  initialPath = "/beneficios",
  client = createBenefitsApiClient(httpFetch),
) {
  track.mockClear();
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/beneficios/*"
          element={<RoutedBenefitsApp client={client} />}
        />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("BenefitsApp", () => {
  afterEach(cleanup);

  it("lists benefits and owns the relative detail route", async () => {
    const user = userEvent.setup();
    renderBenefits();

    expect(
      await screen.findByRole("heading", { name: "Meus benefícios" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /Vale-alimentação/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /Vale-alimentação/ }));

    expect(
      await screen.findByRole("heading", { name: "Vale-alimentação" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Como utilizar")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/beneficios/vale-alimentacao",
    );
  });

  it("renders distinct loading and empty list states", async () => {
    server.use(
      http.get(API_BASE_URL, async () => {
        await delay(30);
        return HttpResponse.json({ items: [] });
      }),
    );
    renderBenefits();
    expect(
      screen.getByRole("status", { name: "Carregando benefícios" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        name: "Nenhum benefício disponível",
      }),
    ).toBeInTheDocument();
  });

  it("retries only a failed list request", async () => {
    server.use(
      http.get(API_BASE_URL, () => new HttpResponse(null, { status: 500 })),
    );
    const user = userEvent.setup();
    renderBenefits();
    expect(
      await screen.findByRole("heading", {
        name: "Não foi possível carregar os benefícios",
      }),
    ).toBeInTheDocument();
    server.resetHandlers();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByRole("link", { name: /Vale-alimentação/ }),
    ).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "beneficios.data.retried",
        properties: expect.objectContaining({ resource: "list" }),
      }),
    );
  });

  it("shows a safe not-found state for an unknown detail", async () => {
    renderBenefits("/beneficios/inexistente");
    expect(
      await screen.findByRole("heading", { name: "Benefício não encontrado" }),
    ).toBeInTheDocument();
  });

  it("shows a retryable detail failure", async () => {
    server.use(
      http.get(
        `${API_BASE_URL}/:id`,
        () => new HttpResponse(null, { status: 503 }),
      ),
    );
    renderBenefits("/beneficios/vale-alimentacao");
    expect(
      await screen.findByRole("heading", {
        name: "Não foi possível carregar o benefício",
      }),
    ).toBeInTheDocument();
  });

  it("keeps the domain cache in memory and emits sanitized telemetry", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const user = userEvent.setup();
    renderBenefits();
    await user.click(
      await screen.findByRole("link", { name: /Vale-alimentação/ }),
    );
    await screen.findByRole("heading", { name: "Vale-alimentação" });

    expect(setItem).not.toHaveBeenCalled();
    const events = JSON.stringify(track.mock.calls);
    expect(events).not.toContain("vale-alimentacao");
    expect(events).not.toContain("Vale-alimentação");
    expect(events).not.toContain("Crédito mensal");
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "beneficios.detail.opened",
        properties: expect.objectContaining({
          domain: "beneficios",
          version: "1.0.0",
          route: "/beneficios/:beneficioId",
          platform: "web",
          correlationId: "beneficios-correlation",
        }),
      }),
    );
    setItem.mockRestore();
  });
});
