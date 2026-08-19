import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createPlatformContext } from "@portal/platform-runtime";
import { JourneyRegistryBoundary } from "./JourneyRegistryBoundary";
import type { AppProps } from "./types";

/** Bootstraps the shell-wide query cache and correlation context. */
export function App(props: AppProps) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  const [correlationContext] = useState(() =>
    createPlatformContext(props.platformMode ?? "web"),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <JourneyRegistryBoundary
        {...props}
        correlationContext={correlationContext}
      />
    </QueryClientProvider>
  );
}
