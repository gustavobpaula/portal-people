import type { ReactNode } from "react";
import { z } from "zod";

/** The semantic version of the platform contract implemented by this workspace. */
export const PLATFORM_CONTRACT_VERSION = "1.0.0";
/** Version of the deliberately small WebView bridge protocol. */
export const BRIDGE_CONTRACT_VERSION = "1.0.0";

const semanticVersion = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, "Use semantic versioning (x.y.z).");
const compatibilityRange = z
  .string()
  .regex(/^[~^]?\d+\.\d+\.\d+$/, "Use a supported compatibility range.");
export const journeyRouteSchema = z
  .string()
  .regex(
    /^\/[a-z0-9][a-z0-9/-]*$/,
    "Routes must be absolute kebab-case paths.",
  );
const nativeRouteSchema = z
  .string()
  .regex(
    /^portal-pessoas:\/\/[a-z0-9][a-z0-9/-]*$/,
    "Native routes must use the portal-pessoas scheme.",
  );

/** Fields shared by every routing strategy before its destination-specific data is added. */
const commonJourney = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  displayName: z.string().trim().min(1).optional(),
  route: journeyRouteSchema,
  version: semanticVersion,
  platformCompatibility: compatibilityRange,
  owner: z.object({ squad: z.string().min(1), contact: z.email() }),
  observability: z.object({
    domain: z.string().min(1),
    eventNamespace: z.string().min(1),
  }),
});

/**
 * Validates a registry entry before the shell decides how to open a journey.
 * The strategy discriminant prevents consumers from treating legacy, native, and federated targets alike.
 */
export const journeyManifestSchema = z.discriminatedUnion("strategy", [
  commonJourney.extend({
    strategy: z.literal("federated-module"),
    remote: z.object({
      name: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      entry: z.url(),
      exposedModule: z.string().regex(/^\.\/[A-Za-z][A-Za-z0-9]*$/),
    }),
  }),
  commonJourney.extend({
    strategy: z.literal("external-web"),
    destination: z.url(),
    returnRoute: journeyRouteSchema,
  }),
  commonJourney.extend({
    strategy: z.literal("native-route"),
    nativeRoute: nativeRouteSchema,
  }),
]).superRefine((journey, context) => {
  if (
    journey.strategy === "external-web" &&
    journey.returnRoute !== `/retorno/${journey.id}`
  ) {
    context.addIssue({
      code: "custom",
      path: ["returnRoute"],
      message: "External journeys must return through their registered portal route.",
    });
  }
});

export type JourneyManifest = z.infer<typeof journeyManifestSchema>;
export type JourneyStrategy = JourneyManifest["strategy"];
export type NativeJourneyManifest = Extract<
  JourneyManifest,
  { strategy: "native-route" }
>;

/** A resolved registry response cannot publish ambiguous journey identities or routes. */
export const journeyRegistryResponseSchema = z
  .array(journeyManifestSchema)
  .superRefine((journeys, context) => {
    const ids = new Set<string>();
    const routes = new Set<string>();
    journeys.forEach((journey, index) => {
      if (ids.has(journey.id)) {
        context.addIssue({ code: "custom", path: [index, "id"], message: "Journey ids must be unique." });
      }
      if (routes.has(journey.route)) {
        context.addIssue({ code: "custom", path: [index, "route"], message: "Journey routes must be unique." });
      }
      ids.add(journey.id);
      routes.add(journey.route);
    });
  });
export type JourneyRegistryResponse = z.infer<typeof journeyRegistryResponseSchema>;

/** The complete allowlist of capabilities that a journey may request from the platform. */
export const platformCapabilitySchema = z.enum([
  "navigation",
  "context",
  "telemetry",
  "flags",
  "notifications",
  "device",
]);
/** Validates a journey's declared capability requirements without accepting arbitrary browser access. */
export const platformCapabilitiesRequestSchema = z
  .object({
    required: z.array(platformCapabilitySchema).max(6),
  })
  .strict();
export type PlatformCapabilityName = z.infer<typeof platformCapabilitySchema>;

export const nativeBridgeCapabilitySchema = z.enum(["native-navigation"]);
export type NativeBridgeCapability = z.infer<typeof nativeBridgeCapabilitySchema>;

export const nativeBridgeDescriptorSchema = z
  .object({
    version: semanticVersion,
    capabilities: z.array(nativeBridgeCapabilitySchema),
  })
  .strict();
export type NativeBridgeDescriptor = z.infer<typeof nativeBridgeDescriptorSchema>;

export const nativeBridgeRequestSchema = z
  .object({
    requestId: z.string().uuid(),
    version: semanticVersion,
    command: z.literal("open-native-route"),
    payload: z.object({ route: nativeRouteSchema }).strict(),
  })
  .strict();
export type NativeBridgeRequest = z.infer<typeof nativeBridgeRequestSchema>;

export const nativeBridgeResponseSchema = z.discriminatedUnion("status", [
  z.object({ requestId: z.string().uuid(), status: z.literal("success") }).strict(),
  z
    .object({
      requestId: z.string().uuid(),
      status: z.literal("rejected"),
    })
    .strict(),
]);
export type NativeBridgeResponse = z.infer<typeof nativeBridgeResponseSchema>;

/** Minimal, non-sensitive context that the shell propagates to an embedded journey. */
export type PlatformContext = Readonly<{
  correlationId: string;
  locale: string;
  platform: "web" | "webview";
}>;

/**
 * The intentionally narrow public API shared by the shell and remotes.
 * Business state, session tokens, and internal browser APIs are excluded by design.
 */
export type PlatformCapabilities = Readonly<{
  navigate: (path: string) => void;
  context: PlatformContext;
  telemetry: {
    track: (event: {
      name: string;
      properties?: Record<string, string | number | boolean>;
    }) => void;
  };
  flags: Readonly<Record<string, boolean>>;
  notifications: { show: (message: string) => void };
  device: {
    isAvailable: (
      capability: "share" | "camera" | "file-picker" | "native-navigation",
    ) => boolean;
  };
}>;

/** Module shape that a `federated-module` manifest must expose to the host runtime. */
export type FederatedJourneyModule = {
  default: (props: { platform: PlatformCapabilities }) => ReactNode;
};
