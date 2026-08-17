import { createModuleFederationConfig } from "@module-federation/vite";
export default createModuleFederationConfig({
  name: "beneficios",
  manifest: true,
  dts: false,
  exposes: { "./Journey": "./src/app/Journey.tsx" },
  shared: {
    react: { singleton: true },
    "react-dom": { singleton: true },
    "react-router-dom": { singleton: true },
  },
});
