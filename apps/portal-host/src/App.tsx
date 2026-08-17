import { useEffect, useState } from 'react';
import manifest from './assets/journey-manifest.json';
import { createWebCapabilities, loadFederatedJourney, type JourneyLoadResult } from '@portal/platform-runtime';

/**
 * Composes the demonstrative journey from its manifest and keeps the shell available on failure.
 */
export function App() {
  const [result, setResult] = useState<JourneyLoadResult>();
  const capabilities = createWebCapabilities();

  useEffect(() => {
    void loadFederatedJourney(manifest).then(setResult);
  }, []);

  if (!result) return <main aria-busy="true">Carregando jornada demonstrativa…</main>;
  if (result.status === 'fallback') return <main role="status">A jornada está indisponível ({result.reason}). O host continua disponível.</main>;

  const Journey = result.module.default;
  return <main><Journey platform={capabilities} /></main>;
}
