import { createModuleFederationConfig } from '@module-federation/vite';

export default createModuleFederationConfig({
  name: 'portal-host', dts: false,
  shared: {
    react: { singleton: true },
    'react/jsx-runtime': { singleton: true },
    'react/jsx-dev-runtime': { singleton: true },
    'react-dom': { singleton: true },
    'react-dom/client': { singleton: true },
    'react-router-dom': { singleton: true }
  }
});
