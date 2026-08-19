import type {
  PlatformContext,
  TelemetryEvent,
  TelemetryKind,
  TelemetryProperties,
} from "@portal/platform-contracts";

export type TelemetrySignal = Readonly<{
  kind: TelemetryKind;
  name: string;
  timestamp: string;
  context: Readonly<{
    domain: string;
    version: string;
    route: string;
    platform: "web" | "webview";
    correlationId: string;
    eventNamespace: string;
  }>;
  attributes: Readonly<Record<string, string | number | boolean>>;
}>;

export type TelemetryExporter = Readonly<{
  export: (signal: TelemetrySignal) => void | Promise<void>;
}>;
export type Clock = () => Date;

const TRACE_ID = /^[0-9a-f]{32}$/;
const SPAN_ID = /^[0-9a-f]{16}$/;
const TRACEPARENT = /^00-([0-9a-f]{32})-([0-9a-f]{16})-0[01]$/;
const SAFE_NAME = /^[a-z][a-z0-9.-]{0,80}$/;
const SAFE_VALUE = /^[a-z][a-z0-9-]{0,63}$/;
const SAFE_VERSION = /^\d+\.\d+\.\d+$/;
const SAFE_ROUTE = /^(?:\/|\/[a-z0-9][a-z0-9/:/-]*)$/;
const SAFE_ATTRIBUTES = new Set([
  "reason",
  "result",
  "resource",
  "source",
  "attempt",
  "validCount",
  "invalidCount",
  "itemCount",
  "durationMs",
  "value",
  "rating",
  "navigationType",
  "statusCode",
]);

function randomHex(length: number) {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function createCorrelationId() {
  return randomHex(32);
}
export function isTraceId(value: string): boolean {
  return TRACE_ID.test(value) && !/^0+$/.test(value);
}
export function createTraceparent(
  correlationId: string,
  spanId = randomHex(16),
) {
  const traceId = isTraceId(correlationId)
    ? correlationId
    : createCorrelationId();
  const safeSpanId =
    SPAN_ID.test(spanId) && !/^0+$/.test(spanId) ? spanId : randomHex(16);
  return `00-${traceId}-${safeSpanId}-01`;
}
export function readTraceparent(
  value: string | null | undefined,
): string | null {
  const match = value?.toLowerCase().match(TRACEPARENT);
  return match &&
    isTraceId(match[1]) &&
    SPAN_ID.test(match[2]) &&
    !/^0+$/.test(match[2])
    ? match[1]
    : null;
}
export function resolveCorrelationId(value?: string | null) {
  return value && isTraceId(value) ? value : createCorrelationId();
}

function safeProperties(properties: TelemetryProperties | undefined) {
  const attributes: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties ?? {})) {
    if (!SAFE_ATTRIBUTES.has(key)) continue;
    if (typeof value === "number" && Number.isFinite(value))
      attributes[key] = value;
    if (typeof value === "boolean") attributes[key] = value;
    if (typeof value === "string" && SAFE_VALUE.test(value))
      attributes[key] = value;
  }
  return attributes;
}

function normalize(
  event: TelemetryEvent,
  base: PlatformContext,
  now: Clock,
): TelemetrySignal | null {
  const properties = event.properties ?? {};
  const domain = properties.domain ?? "portal";
  const version = properties.version ?? "1.0.0";
  const route = properties.route;
  const namespace = properties.eventNamespace ?? domain;
  if (
    typeof domain !== "string" ||
    !SAFE_VALUE.test(domain) ||
    typeof version !== "string" ||
    !SAFE_VERSION.test(version) ||
    typeof route !== "string" ||
    !SAFE_ROUTE.test(route) ||
    typeof namespace !== "string" ||
    !SAFE_VALUE.test(namespace) ||
    !SAFE_NAME.test(event.name) ||
    !isTraceId(base.correlationId)
  )
    return null;
  return {
    kind: event.kind ?? "analytics",
    name: event.name,
    timestamp: now().toISOString(),
    context: {
      domain,
      version,
      route,
      platform: base.platform,
      correlationId: base.correlationId,
      eventNamespace: namespace,
    },
    attributes: safeProperties(properties),
  };
}

/** Exports only normalized signals; exporter failures never alter product behavior. */
export function createTelemetry(
  base: PlatformContext,
  exporter: TelemetryExporter = createConsoleExporter(),
  now: Clock = () => new Date(),
) {
  return {
    track(event: TelemetryEvent) {
      const signal = normalize(event, base, now);
      if (!signal) return;
      try {
        Promise.resolve(exporter.export(signal)).catch(() => undefined);
      } catch {
        /* intentionally isolated */
      }
    },
  };
}

export function createConsoleExporter(
  consoleLike: Pick<Console, "info"> = console,
): TelemetryExporter {
  return {
    export: (signal) =>
      consoleLike.info("portal-observability", JSON.stringify(signal)),
  };
}

export type HttpObservation = Readonly<{
  telemetry: { track: (event: TelemetryEvent) => void };
  context: PlatformContext;
  domain: string;
  version: string;
  route: string;
  eventNamespace: string;
  operation: string;
  now?: () => number;
}>;

/** Adds only W3C and platform headers, measures duration, and never records request data. */
export async function observeFetch(
  fetcher: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  observation: HttpObservation,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set(
    "traceparent",
    createTraceparent(observation.context.correlationId),
  );
  headers.set("x-portal-platform", observation.context.platform);
  const start = (observation.now ?? performance.now.bind(performance))();
  const base = {
    domain: observation.domain,
    version: observation.version,
    route: observation.route,
    eventNamespace: observation.eventNamespace,
  };
  try {
    const response = await fetcher(input, { ...init, headers });
    observation.telemetry.track({
      kind: "metric",
      name: `${observation.operation}.duration`,
      properties: {
        ...base,
        result: response.ok ? "success" : "http-failure",
        statusCode: response.status,
        durationMs: Math.round(
          (observation.now ?? performance.now.bind(performance))() - start,
        ),
      },
    });
    return response;
  } catch (error) {
    observation.telemetry.track({
      kind: "metric",
      name: `${observation.operation}.duration`,
      properties: {
        ...base,
        result: "network-failure",
        durationMs: Math.round(
          (observation.now ?? performance.now.bind(performance))() - start,
        ),
      },
    });
    throw error;
  }
}
