// @ts-nocheck
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Journey from "./Journey";
import { createWebCapabilities } from "@portal/platform-runtime";
const root = document.getElementById("root");
if (!root) throw new Error("Root element is required.");
createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <Journey platform={createWebCapabilities()} />
    </BrowserRouter>
  </StrictMode>,
);
