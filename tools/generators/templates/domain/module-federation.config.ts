import { createModuleFederationConfig } from "@module-federation/vite";
export function createFederationConfig(withFallback = true) {
  return createModuleFederationConfig({
  name: "__DOMAIN_NAME__",
  manifest: true,
  dts: false,
  exposes: { "./Journey": "./src/app/Journey.tsx" },
  shared: {
    react: { singleton: true, import: withFallback ? "react" : false },
    "react-dom": { singleton: true, import: withFallback ? "react-dom" : false },
    "react-router-dom": { singleton: true, import: withFallback ? "react-router-dom" : false },
  },
  });
}
export default createFederationConfig();
