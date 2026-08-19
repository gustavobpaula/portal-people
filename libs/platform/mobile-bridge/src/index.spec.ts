import { describe, expect, it, vi } from "vitest";
import { createPlatformAdapter, createSimulatedNativeBridge } from "./index";

const manifest = {
  id: "recursos-do-app",
  displayName: "Recursos do aplicativo",
  route: "/recursos-do-app",
  strategy: "native-route",
  version: "1.0.0",
  platformCompatibility: "^1.0.0",
  owner: { squad: "Plataforma Mobile", contact: "mobile@example.test" },
  observability: {
    domain: "recursos-do-app",
    eventNamespace: "recursos-do-app",
  },
  nativeRoute: "portal-pessoas://recursos",
} as const;

const base = {
  navigate: () => undefined,
  telemetry: { track: () => undefined },
  origin: "http://localhost:4200",
  allowedOrigins: ["http://localhost:4200"],
} as const;

describe("platform mobile bridge", () => {
  it("falls back in a browser without invoking a bridge", async () => {
    const adapter = createPlatformAdapter({ ...base, mode: "web" });
    await expect(adapter.openNativeRoute(manifest)).resolves.toEqual({
      status: "fallback",
      reason: "native-unavailable",
    });
    expect(adapter.capabilities.context.platform).toBe("web");
  });

  it("opens only the registered native route through an authorized WebView bridge", async () => {
    const invoke = vi.fn(async (request) => ({
      requestId: request.requestId,
      status: "success",
    }));
    const adapter = createPlatformAdapter({
      ...base,
      mode: "webview",
      bridge: {
        negotiate: () => ({
          version: "1.0.0",
          capabilities: ["native-navigation"],
        }),
        invoke,
      },
    });
    await expect(adapter.openNativeRoute(manifest)).resolves.toEqual({
      status: "opened",
    });
    expect(adapter.capabilities.context.platform).toBe("webview");
    expect(adapter.capabilities.device.isAvailable("native-navigation")).toBe(
      true,
    );
    expect(invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        command: "open-native-route",
        payload: { route: "portal-pessoas://recursos" },
      }),
    );
  });

  it.each([
    [
      "bridge-incompatible",
      {
        negotiate: () => ({
          version: "2.0.0",
          capabilities: ["native-navigation"],
        }),
        invoke: async () => undefined,
      },
      base,
    ],
    [
      "capability-unavailable",
      {
        negotiate: () => ({ version: "1.0.0", capabilities: [] }),
        invoke: async () => undefined,
      },
      base,
    ],
    [
      "origin-not-allowed",
      createSimulatedNativeBridge(),
      { ...base, origin: "http://localhost:4600" },
    ],
  ])(
    "returns %s without opening a native route",
    async (reason, bridge, options) => {
      const adapter = createPlatformAdapter({
        ...options,
        mode: "webview",
        bridge,
      });
      await expect(adapter.openNativeRoute(manifest)).resolves.toEqual({
        status: "fallback",
        reason,
      });
    },
  );

  it("contains a synchronous bridge negotiation failure", async () => {
    const adapter = createPlatformAdapter({
      ...base,
      mode: "webview",
      bridge: {
        negotiate: () => {
          throw new Error("native host unavailable");
        },
        invoke: async () => undefined,
      },
    });

    await expect(adapter.openNativeRoute(manifest)).resolves.toEqual({
      status: "fallback",
      reason: "bridge-unavailable",
    });
    expect(adapter.capabilities.device.isAvailable("native-navigation")).toBe(
      false,
    );
  });

  it.each([
    [
      "invalid-payload",
      {
        ...manifest,
        nativeRoute: "https://untrusted.example/resource",
      } as unknown as typeof manifest,
      (request: unknown) => ({
        requestId: (request as { requestId: string }).requestId,
        status: "success",
      }),
    ],
    [
      "bridge-rejected",
      manifest,
      () => ({ requestId: crypto.randomUUID(), status: "success" }),
    ],
  ])(
    "rejects %s without treating the command as opened",
    async (reason, unsafeManifest, response) => {
      const invoke = vi.fn(async (request) => response(request));
      const adapter = createPlatformAdapter({
        ...base,
        mode: "webview",
        bridge: {
          negotiate: () => ({
            version: "1.0.0",
            capabilities: ["native-navigation"],
          }),
          invoke,
        },
      });

      await expect(adapter.openNativeRoute(unsafeManifest)).resolves.toEqual({
        status: "fallback",
        reason,
      });
      if (reason === "invalid-payload") expect(invoke).not.toHaveBeenCalled();
    },
  );

  it("distinguishes a timeout and ignores a late bridge response", async () => {
    const adapter = createPlatformAdapter({
      ...base,
      mode: "webview",
      timeoutMs: 1,
      bridge: {
        negotiate: () => ({
          version: "1.0.0",
          capabilities: ["native-navigation"],
        }),
        invoke: async (request) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { requestId: request.requestId, status: "success" };
        },
      },
    });
    await expect(adapter.openNativeRoute(manifest)).resolves.toEqual({
      status: "fallback",
      reason: "bridge-timeout",
    });
  });
});
