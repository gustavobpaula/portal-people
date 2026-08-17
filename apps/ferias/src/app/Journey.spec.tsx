import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlatformCapabilities } from "@portal/platform-contracts";
import { VacationsApp } from "./Journey";
import { createVacationsApiClient } from "../services/api/vacations-api";
import {
  balanceUnavailableEligibility,
  noEligibleDaysEligibility,
} from "../services/api/vacation-fixtures";
import { server } from "../mocks/server";

const track = vi.fn();
const API_BASE_URL = "http://localhost/api/vacations";
const httpFetch = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(new URL(input.toString(), "http://localhost").toString(), init);

function renderVacations() {
  track.mockClear();
  const platform: PlatformCapabilities = {
    navigate: () => undefined,
    context: {
      correlationId: "ferias-correlation",
      locale: "pt-BR",
      platform: "web",
    },
    telemetry: { track },
    flags: {},
    notifications: { show: () => undefined },
    device: { isAvailable: () => false },
  };
  return render(
    <VacationsApp
      client={createVacationsApiClient(httpFetch)}
      platform={platform}
    />,
  );
}

function fillValidRequest() {
  fireEvent.change(screen.getByLabelText("Data de início"), {
    target: { value: "2026-09-01" },
  });
  fireEvent.change(screen.getByLabelText("Quantidade de dias"), {
    target: { value: "10" },
  });
}

describe("VacationsApp", () => {
  afterEach(cleanup);

  it("submits a reviewed request and confirms the synthetic protocol", async () => {
    const user = userEvent.setup();
    renderVacations();
    expect(
      await screen.findByText("Saldo disponível: 20 dias.", { exact: false }),
    ).toBeInTheDocument();
    fillValidRequest();
    await user.click(
      screen.getByRole("button", { name: "Revisar solicitação" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Revise sua solicitação" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/01 de setembro de 2026 a 10 de setembro de 2026/),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Confirmar solicitação" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Solicitação enviada" }),
    ).toBeInTheDocument();
    expect(screen.getByText("FERIAS-2026-0001")).toBeInTheDocument();
    expect(
      screen.getByText(
        (_content, element) =>
          element?.tagName === "DD" &&
          element.textContent === "Solicitação enviada",
      ),
    ).toBeInTheDocument();
  });

  it("blocks invalid input with associated field errors", async () => {
    const user = userEvent.setup();
    renderVacations();
    await screen.findByLabelText("Data de início");
    fireEvent.change(screen.getByLabelText("Data de início"), {
      target: { value: "2027-08-31" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade de dias"), {
      target: { value: "20" },
    });
    await user.click(
      screen.getByRole("button", { name: "Revisar solicitação" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "período elegível",
    );
    expect(
      screen.queryByRole("heading", { name: "Revise sua solicitação" }),
    ).not.toBeInTheDocument();
  });

  it("preserves form values when returning from review to edit", async () => {
    const user = userEvent.setup();
    renderVacations();
    await screen.findByLabelText("Data de início");
    fillValidRequest();
    await user.click(
      screen.getByRole("button", { name: "Revisar solicitação" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Editar solicitação" }),
    );
    expect(screen.getByLabelText("Data de início")).toHaveValue("2026-09-01");
    expect(screen.getByLabelText("Quantidade de dias")).toHaveValue(10);
  });

  it("renders loading, unavailable balance, no eligible days, and retryable errors distinctly", async () => {
    server.use(
      http.get(`${API_BASE_URL}/eligibility`, async () => {
        await delay(20);
        return HttpResponse.json(balanceUnavailableEligibility);
      }),
    );
    renderVacations();
    expect(
      screen.getByRole("status", {
        name: "Carregando elegibilidade de férias",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Saldo indisponível" }),
    ).toBeInTheDocument();

    cleanup();
    server.use(
      http.get(`${API_BASE_URL}/eligibility`, () =>
        HttpResponse.json(noEligibleDaysEligibility),
      ),
    );
    renderVacations();
    expect(
      await screen.findByRole("heading", {
        name: "Não há dias de férias elegíveis",
      }),
    ).toBeInTheDocument();

    cleanup();
    server.use(
      http.get(
        `${API_BASE_URL}/eligibility`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderVacations();
    expect(
      await screen.findByRole("heading", {
        name: "Não foi possível consultar suas férias",
      }),
    ).toBeInTheDocument();
    server.resetHandlers();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByLabelText("Data de início")).toBeInTheDocument();
  });

  it("preserves the reviewed request after a submission failure and sanitizes telemetry", async () => {
    server.use(
      http.post(
        `${API_BASE_URL}/requests`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const user = userEvent.setup();
    renderVacations();
    await screen.findByLabelText("Data de início");
    fillValidRequest();
    await user.click(
      screen.getByRole("button", { name: "Revisar solicitação" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar solicitação" }),
    );
    expect(
      await screen.findByRole("heading", {
        name: "Não foi possível enviar a solicitação",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/01 de setembro de 2026 a 10 de setembro de 2026/),
    ).toBeInTheDocument();
    expect(storage).not.toHaveBeenCalled();
    const events = JSON.stringify(track.mock.calls);
    expect(events).not.toContain("2026-09-01");
    expect(events).not.toContain("FERIAS-2026-0001");
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "ferias.request.failed",
        properties: expect.objectContaining({
          domain: "ferias",
          version: "1.0.0",
          route: "/ferias",
          platform: "web",
          correlationId: "ferias-correlation",
        }),
      }),
    );
    storage.mockRestore();
  });
});
