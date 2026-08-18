import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlatformCapabilities } from "@portal/platform-contracts";
import { App } from "./App";
import { server } from "./mocks/server";
import registry from "./assets/journey-registry.json";

const track = vi.fn();
const capabilities: PlatformCapabilities = {
  navigate: vi.fn(),
  context: {
    correlationId: "correlation-core",
    locale: "pt-BR",
    platform: "web",
  },
  telemetry: { track },
  flags: {},
  notifications: { show: () => undefined },
  device: { isAvailable: () => false },
};

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="location">{`${location.pathname}${location.search}`}</output>
  );
}

function renderHome(initialEntry = "/") {
  track.mockClear();
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App createCapabilities={() => capabilities} registryData={registry} />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("portal experiences", () => {
  afterEach(cleanup);

  it("renders search and Produtos on the home route without repeating journeys in the header", async () => {
    renderHome();
    expect(
      await screen.findByRole("heading", { name: "Portal Pessoas" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Produtos" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notificações" })).toHaveAttribute(
      "href",
      "/notificacoes",
    );
    await screen.findByText("4 resultados");
    expect(
      screen.getAllByRole("link", { name: /Fundação da plataforma/ }),
    ).toHaveLength(1);
    expect(screen.getByRole("link", { name: /Benefícios/ })).toHaveAttribute(
      "href",
      "/beneficios",
    );
    expect(screen.getByRole("link", { name: /Férias/ })).toHaveAttribute(
      "href",
      "/ferias",
    );
    expect(
      screen.getByRole("link", { name: /Holerite legado/ }),
    ).toHaveAttribute("href", "/holerite");
  });

  it("keeps submitted search results on the home route and restores them from q", async () => {
    const user = userEvent.setup();
    renderHome();
    const input = await screen.findByRole("textbox", {
      name: "Buscar no portal",
    });
    await user.type(input, "PLATAFORMA");
    await user.keyboard("{Enter}");
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/?q=PLATAFORMA",
    );
    expect(
      await screen.findByRole("heading", {
        name: "Resultados para “PLATAFORMA”",
      }),
    ).toBeInTheDocument();
    cleanup();
    renderHome("/?q=PLATAFORMA");
    expect(await screen.findByDisplayValue("PLATAFORMA")).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /Fundação da plataforma/ }),
    ).toBeInTheDocument();
  });

  it("finds Benefícios in Produtos and keeps its registered route", async () => {
    const user = userEvent.setup();
    renderHome();
    const input = await screen.findByRole("textbox", {
      name: "Buscar no portal",
    });
    await user.type(input, "BENEFICIOS");
    await user.keyboard("{Enter}");
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/?q=BENEFICIOS",
    );
    expect(
      await screen.findByRole("link", { name: /Benefícios/ }),
    ).toHaveAttribute("href", "/beneficios");
    expect(
      screen.queryByRole("link", { name: /Fundação da plataforma/ }),
    ).not.toBeInTheDocument();
  });

  it("shows a clear action for an empty search and restores the catalog", async () => {
    const user = userEvent.setup();
    renderHome("/?q=inexistente");
    expect(
      await screen.findByRole("heading", {
        name: "Nenhum resultado encontrado",
      }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpar busca" }));
    expect(await screen.findByTestId("location")).toHaveTextContent("/");
    expect(
      await screen.findByRole("heading", { name: "Produtos" }),
    ).toBeInTheDocument();
  });

  it("opens notifications from the header and persists reads for the current browser session only", async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(await screen.findByRole("link", { name: "Notificações" }));
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/notificacoes",
    );
    const unreadNotification = await screen.findByRole("button", {
      name: "Portal atualizado, não lida",
    });
    expect(unreadNotification.className).toContain("notificationItemUnread");
    unreadNotification.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByText("Todas as notificações foram lidas"),
    ).toBeInTheDocument();
    cleanup();
    renderHome("/notificacoes");
    expect(
      await screen.findByText("Todas as notificações foram lidas"),
    ).toBeInTheDocument();
    window.sessionStorage.clear();
    cleanup();
    renderHome("/notificacoes");
    expect(await screen.findByText("1 não lida")).toBeInTheDocument();
  });

  it("retries only the Produtos request", async () => {
    server.use(
      http.get(
        "/api/portal/catalog",
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderHome();
    expect(
      await screen.findByRole("heading", {
        name: "Não foi possível carregar os Produtos",
      }),
    ).toBeInTheDocument();
    server.resetHandlers();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByRole("link", { name: /Fundação da plataforma/ }),
    ).toBeInTheDocument();
  });

  it("renders distinct loading and empty states for Produtos and notifications", async () => {
    server.use(
      http.get("/api/portal/catalog", async () => {
        await delay(30);
        return HttpResponse.json({ items: [] });
      }),
      http.get("/api/portal/notifications", () =>
        HttpResponse.json({ items: [] }),
      ),
    );
    renderHome();
    expect(
      screen.getByRole("status", { name: "Carregando Produtos" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Nenhum produto disponível" }),
    ).toBeInTheDocument();
    cleanup();
    renderHome("/notificacoes");
    expect(
      await screen.findByRole("heading", { name: "Nenhuma notificação" }),
    ).toBeInTheDocument();
  });

  it("retries notification loading without changing the session state", async () => {
    server.use(
      http.get(
        "/api/portal/notifications",
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderHome("/notificacoes");
    expect(
      await screen.findByRole("heading", {
        name: "Não foi possível carregar as notificações",
      }),
    ).toBeInTheDocument();
    server.resetHandlers();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByRole("button", {
        name: "Portal atualizado, não lida",
      }),
    ).toBeInTheDocument();
  });

  it("emits sanitized search and notification telemetry", async () => {
    const user = userEvent.setup();
    renderHome();
    const input = await screen.findByRole("textbox", {
      name: "Buscar no portal",
    });
    await user.type(input, "segredo-da-busca");
    await user.keyboard("{Enter}");
    await screen.findByRole("heading", { name: "Nenhum resultado encontrado" });
    await user.click(screen.getByRole("link", { name: "Notificações" }));
    await user.click(
      await screen.findByRole("button", {
        name: "Portal atualizado, não lida",
      }),
    );
    const serialized = JSON.stringify(track.mock.calls);
    expect(serialized).not.toContain("segredo-da-busca");
    expect(serialized).not.toContain("A nova navegação");
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "portal.core.search.submitted",
        properties: expect.objectContaining({
          route: "/",
          platform: "web",
          correlationId: "correlation-core",
        }),
      }),
    );
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "portal.core.notifications.opened",
        properties: expect.objectContaining({
          route: "/notificacoes",
          platform: "web",
          correlationId: "correlation-core",
        }),
      }),
    );
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "portal.core.notification.read",
        properties: expect.objectContaining({ route: "/notificacoes" }),
      }),
    );
  });
});
