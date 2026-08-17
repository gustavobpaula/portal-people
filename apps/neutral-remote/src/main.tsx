import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Journey from "./app/Journey";
import { createWebCapabilities } from "@portal/platform-runtime";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element is required.");
createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <Journey platform={createWebCapabilities()} />
    </BrowserRouter>
  </StrictMode>,
);
