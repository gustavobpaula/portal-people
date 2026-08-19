import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type {
  FederatedJourneyModule,
  PlatformCapabilities,
} from "@portal/platform-contracts";
import type { PlatformAdapter } from "@portal/platform-mobile-bridge";
import type { JourneyLoadResult } from "@portal/platform-runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JourneyRegistryError, type JourneyRegistryClient } from "../services/journey-registry/journey-registry";
import { App } from "./App";

const manifest = {
  id: "neutral-journey",
  displayName: "Fundação da plataforma",
  route: "/foundation",
  strategy: "federated-module",
  version: "1.0.0",
  platformCompatibility: "^1.0.0",
  owner: { squad: "platform", contact: "platform@example.test" },
  observability: { domain: "foundation", eventNamespace: "foundation" },
  remote: {
    name: "neutral-remote",
    entry: "http://localhost:4201/mf-manifest.json",
    exposedModule: "./Journey",
  },
} as const;

const track = vi.fn();
const capabilities: PlatformCapabilities = {
  navigate: vi.fn(),
  context: {
    correlationId: "correlation-stable",
    locale: "pt-BR",
    platform: "web",
  },
  telemetry: { track },
  flags: {},
  notifications: { show: () => undefined },
  device: { isAvailable: () => false },
};

function renderShell(
  options: {
    registryData?: unknown;
    initialPath?: string;
    loadJourney?: (value: unknown) => Promise<JourneyLoadResult>;
    navigateExternal?: (destination: string) => void;
    externalOrigins?: readonly string[];
    checkExternalAvailability?: (destination: string) => Promise<boolean>;
    createPlatformAdapter?: PlatformAdapter;
    journeyRegistryClient?: JourneyRegistryClient;
    fromRegistry?: boolean;
  } = {},
) {
  const createCapabilities = vi.fn(() => capabilities);
  const injectedPlatformAdapter = options.createPlatformAdapter;
  return {
    createCapabilities,
    ...render(
      <MemoryRouter initialEntries={[options.initialPath ?? "/foundation"]}>
        <App
          registryData={options.fromRegistry ? undefined : options.registryData ?? [manifest]}
          journeyRegistryClient={options.journeyRegistryClient}
          loadJourney={
            (options.loadJourney ??
              (async () => ({
                status: "ready",
                manifest,
                module: { default: () => <p>Jornada carregada</p> },
              }))) as typeof import("@portal/platform-runtime").loadFederatedJourney
          }
          createCapabilities={injectedPlatformAdapter ? undefined : createCapabilities as typeof import("@portal/platform-runtime").createWebCapabilities}
          createPlatformAdapter={injectedPlatformAdapter ? () => injectedPlatformAdapter : undefined}
          navigateExternal={options.navigateExternal}
          externalOrigins={options.externalOrigins}
          checkExternalAvailability={options.checkExternalAvailability}
        />
      </MemoryRouter>,
    ),
  };
}

describe("App", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  beforeEach(() => {
    track.mockReset();
    vi.mocked(capabilities.navigate).mockReset();
  });

  it("renders the shell and keeps platform capabilities stable", async () => {
    const received = vi.fn();
    const remote: FederatedJourneyModule = {
      default: ({ platform }) => {
        received(platform);
        return <p>Correlação: {platform.context.correlationId}</p>;
      },
    };
    const loader = vi.fn(
      async (): Promise<JourneyLoadResult> => ({
        status: "ready",
        manifest,
        module: remote,
      }),
    );
    const view = renderShell({ loadJourney: loader });

    await screen.findByText("Correlação: correlation-stable");
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(view.createCapabilities).toHaveBeenCalledTimes(1);
    expect(received).toHaveBeenLastCalledWith(capabilities);
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ name: "portal.journey.load.succeeded" }),
    );
  });

  it("isolates an invalid manifest while preserving a valid journey", async () => {
    renderShell({ registryData: [manifest, {}] });
    await screen.findByText("Jornada carregada");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Algumas jornadas não puderam ser registradas",
    );
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "portal.registry.resolved",
        properties: expect.objectContaining({ invalidCount: 1 }),
      }),
    );
  });

  it("uses the safe catalog and emits sanitized telemetry when the Registry is unavailable", async () => {
    const registryClient: JourneyRegistryClient = { getJourneys: async () => { throw new JourneyRegistryError("network"); } };
    renderShell({ fromRegistry: true, journeyRegistryClient: registryClient });

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível atualizar as jornadas");
    expect(track).toHaveBeenCalledWith(expect.objectContaining({ name: "portal.registry.fetch.failed" }));
    const telemetry = JSON.stringify(track.mock.calls);
    expect(telemetry).not.toMatch(/portal-pessoas|mobile@example\.test|token|matr[ií]cula/i);
  });

  it("keeps the shell available when a native route is opened in the browser", async () => {
    const native = { ...manifest, id: "recursos-do-app", displayName: "Recursos do aplicativo", route: "/recursos-do-app", strategy: "native-route", nativeRoute: "portal-pessoas://recursos" } as const;
    renderShell({ registryData: [native], initialPath: "/recursos-do-app" });
    expect(await screen.findByText("Este recurso está disponível apenas no aplicativo.")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(expect.objectContaining({ name: "portal.journey.native.fallback.shown" }));
  });

  it("emits sanitized telemetry for a successful native activation", async () => {
    const native = { ...manifest, id: "recursos-do-app", displayName: "Recursos do aplicativo", route: "/recursos-do-app", strategy: "native-route", nativeRoute: "portal-pessoas://recursos" } as const;
    const adapter: PlatformAdapter = {
      capabilities: { ...capabilities, context: { ...capabilities.context, platform: "webview" } },
      openNativeRoute: async () => ({ status: "opened" }),
    };
    renderShell({ registryData: [native], initialPath: "/recursos-do-app", createPlatformAdapter: adapter });

    expect(
      await screen.findByRole("heading", {
        name: "Recursos do aplicativo aberto",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", {
        name: "Recursos do aplicativo aberto",
      }),
    ).toHaveLength(1);
    expect(track).toHaveBeenCalledWith(expect.objectContaining({ name: "portal.journey.native.activation.started" }));
    expect(track).toHaveBeenCalledWith(expect.objectContaining({ name: "portal.journey.native.opened" }));
    const telemetry = JSON.stringify(track.mock.calls);
    expect(telemetry).not.toMatch(/portal-pessoas|requestId|token|matr[ií]cula|mobile@example\.test/i);
  });

  it("retries only the selected federated journey", async () => {
    const loader = vi
      .fn()
      .mockResolvedValueOnce({ status: "fallback", reason: "remote-timeout" })
      .mockResolvedValueOnce({
        status: "ready",
        manifest,
        module: { default: () => <p>Recuperada</p> },
      });
    renderShell({
      loadJourney: loader as (value: unknown) => Promise<JourneyLoadResult>,
    });

    await screen.findByText(
      "A jornada demorou mais que o esperado para responder.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await screen.findByText("Recuperada");
    expect(loader).toHaveBeenCalledTimes(2);
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ name: "portal.journey.load.retried" }),
    );
  });

  it("contains render errors without unmounting the shell", async () => {
    const ThrowingJourney = () => {
      throw new Error("private remote detail");
    };
    renderShell({
      loadJourney: async () => ({
        status: "ready",
        manifest,
        module: { default: ThrowingJourney },
      }),
    });
    await screen.findByText("A jornada encontrou um erro ao ser exibida.");
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("opens the allowlisted legacy payslip with a fixed return route", async () => {
    window.localStorage.setItem(
      "journeyDestination",
      "http://localhost:4600/holerite",
    );
    const navigateExternal = vi.fn();
    const external = {
      ...manifest,
      id: "holerite-legado",
      displayName: "Holerite legado",
      route: "/holerite",
      strategy: "external-web",
      version: "0.9.0",
      destination: "http://localhost:4500/holerite",
      returnRoute: "/retorno/holerite-legado",
    } as const;

    renderShell({
      registryData: [external],
      initialPath: "/holerite?destination=http://localhost:4600/holerite",
      navigateExternal,
      externalOrigins: ["http://localhost:4500"],
      checkExternalAvailability: async () => true,
    });

    await waitFor(() =>
      expect(navigateExternal).toHaveBeenCalledWith(
        "http://localhost:4500/holerite?returnTo=http%3A%2F%2Flocalhost%3A3000%2Fretorno%2Fholerite-legado",
      ),
    );
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ name: "portal.journey.external.transitioned" }),
    );
    const telemetry = JSON.stringify(track.mock.calls);
    expect(telemetry).not.toMatch(/journeyDestination|localhost:4600|token|matr[ií]cula/i);
  });

  it("rejects a forbidden external origin without hiding modern journeys", async () => {
    const external = {
      ...manifest,
      id: "holerite-legado",
      displayName: "Holerite legado",
      route: "/holerite",
      strategy: "external-web",
      version: "0.9.0",
      destination: "http://localhost:4600/holerite",
      returnRoute: "/retorno/holerite-legado",
    } as const;
    const ferias = {
      ...manifest,
      id: "ferias",
      displayName: "Férias",
      route: "/ferias",
      remote: { ...manifest.remote, name: "ferias" },
    } as const;

    renderShell({
      registryData: [external, ferias],
      initialPath: "/holerite",
    });
    expect(
      await screen.findByText("O destino externo não é permitido pela plataforma."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao portal" }));
    expect(
      await screen.findByRole("heading", { name: "Portal Pessoas" }),
    ).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /Férias/ })).toHaveAttribute(
      "href",
      "/ferias",
    );
  });

  it("keeps the shell available when the legacy service is offline", async () => {
    const navigateExternal = vi.fn();
    const external = {
      ...manifest,
      id: "holerite-legado",
      displayName: "Holerite legado",
      route: "/holerite",
      strategy: "external-web",
      version: "0.9.0",
      destination: "http://localhost:4500/holerite",
      returnRoute: "/retorno/holerite-legado",
    } as const;
    const ferias = {
      ...manifest,
      id: "ferias",
      displayName: "Férias",
      route: "/ferias",
      remote: { ...manifest.remote, name: "ferias" },
    } as const;

    renderShell({
      registryData: [external, ferias],
      initialPath: "/holerite",
      navigateExternal,
      externalOrigins: ["http://localhost:4500"],
      checkExternalAvailability: async () => false,
    });

    expect(
      await screen.findByText("A jornada está temporariamente indisponível."),
    ).toBeInTheDocument();
    expect(navigateExternal).not.toHaveBeenCalled();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "portal.journey.load.failed",
        properties: expect.objectContaining({ reason: "external-unavailable" }),
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao portal" }));
    expect(await screen.findByRole("link", { name: /Férias/ })).toHaveAttribute(
      "href",
      "/ferias",
    );
  });

  it("validates the external return against the registered journey", async () => {
    const external = {
      ...manifest,
      id: "holerite-legado",
      route: "/holerite",
      strategy: "external-web",
      destination: "http://localhost:4500/holerite",
      returnRoute: "/retorno/holerite-legado",
    } as const;
    renderShell({
      registryData: [external],
      initialPath: "/retorno/holerite-legado",
    });

    expect(
      await screen.findByRole("heading", { name: "Portal Pessoas" }),
    ).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({ name: "portal.journey.external.returned" }),
    );
  });

  it("rejects a return route that differs from the registered manifest", async () => {
    const external = {
      ...manifest,
      id: "holerite-legado",
      route: "/holerite",
      strategy: "external-web",
      destination: "http://localhost:4500/holerite",
      returnRoute: "/retorno/outra-jornada",
    } as const;
    renderShell({
      registryData: [external],
      initialPath: "/retorno/holerite-legado",
    });

    expect(
      await screen.findByText("A rota de retorno da jornada não é válida."),
    ).toBeInTheDocument();
    expect(track).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "portal.journey.external.returned" }),
    );
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "portal.journey.load.failed",
        properties: expect.objectContaining({
          route: "/retorno/holerite-legado",
          reason: "invalid-return-route",
          platform: "web",
          correlationId: "correlation-stable",
        }),
      }),
    );
  });
});
