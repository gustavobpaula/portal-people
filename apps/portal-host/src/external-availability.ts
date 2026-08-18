const EXTERNAL_HEALTH_TIMEOUT_MS = 2_000;

/** Checks an external journey before the browser leaves the Portal shell. */
export async function isExternalJourneyAvailable(destination: string) {
  const healthUrl = new URL("/health", destination).toString();
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    EXTERNAL_HEALTH_TIMEOUT_MS,
  );

  try {
    const response = await fetch(healthUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}
