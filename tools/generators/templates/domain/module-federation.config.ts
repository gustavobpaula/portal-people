import { createModuleFederationConfig } from "@module-federation/vite";
export default createModuleFederationConfig({
  name: "__DOMAIN_NAME__",
  manifest: true,
  dts: false,
  exposes: { "./Journey": "./src/Journey.tsx" },
  shared: {
    react: { singleton: true },
    "react-dom": { singleton: true },
    "react-router-dom": { singleton: true },
  },
});
