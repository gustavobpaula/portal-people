import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { createSimulatedNativeBridge } from "@portal/platform-mobile-bridge";
import "./app/global.scss";

async function bootstrap() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass', serviceWorker: { url: '/mockServiceWorker.js' } });
  }
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element is required.");
  const platformMode = import.meta.env.DEV && new URLSearchParams(window.location.search).get("platform") === "webview" ? "webview" : "web";
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App platformMode={platformMode} nativeBridge={platformMode === "webview" ? createSimulatedNativeBridge() : undefined} />
      </BrowserRouter>
    </StrictMode>,
  );
}

void bootstrap();
