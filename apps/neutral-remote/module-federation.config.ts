import { createModuleFederationConfig } from '@module-federation/vite';

export function createFederationConfig(withFallback = true) {
  return createModuleFederationConfig({
  name: 'neutral-remote', manifest: true, dts: false, exposes: { './Journey': './src/app/Journey.tsx' },
    shared: {
      react: { singleton: true, import: withFallback ? 'react' : false },
      'react/jsx-runtime': { singleton: true, import: withFallback ? 'react/jsx-runtime' : false },
      'react/jsx-dev-runtime': { singleton: true, import: withFallback ? 'react/jsx-dev-runtime' : false },
      'react-dom': { singleton: true, import: withFallback ? 'react-dom' : false },
      'react-dom/client': { singleton: true, import: withFallback ? 'react-dom/client' : false },
      'react-router-dom': { singleton: true, import: withFallback ? 'react-router-dom' : false }
    }
  });
}
export default createFederationConfig();
