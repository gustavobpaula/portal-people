export const KIB = 1024;
export const performanceBudgets = {
  shellJs: { warning: 180 * KIB, blocking: 200 * KIB },
  remoteJs: { warning: 90 * KIB, blocking: 100 * KIB },
  initialTotal: { warning: 315 * KIB, blocking: 350 * KIB },
  routeCss: { warning: 30 * KIB, blocking: 35 * KIB },
};

export function evaluateBudget(category, bytes) {
  const limit = performanceBudgets[category];
  if (!limit) throw new Error(`Categoria de budget desconhecida: ${category}`);
  return bytes > limit.blocking
    ? "blocking"
    : bytes > limit.warning
      ? "warning"
      : "ok";
}

export function summarizeResponses(responses, extension) {
  const seen = new Set();
  return responses
    .filter(({ url }) => {
      if (!url.endsWith(extension) || seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .reduce((total, response) => total + response.gzipBytes, 0);
}

/** Returns every distinct federated remote declared by the resolved journey catalog. */
export function federatedRemoteNames(registry) {
  return [
    ...new Set(
      registry
        .filter((journey) => journey.strategy === "federated-module")
        .map((journey) => journey.remote.name),
    ),
  ];
}

/** Rewrites only registered remote origins while preserving manifest content in memory. */
export function rewriteRemoteEntries(manifest, locations) {
  return Object.entries(locations).reduce(
    (result, [entry, location]) => result.replaceAll(entry, location),
    manifest,
  );
}
