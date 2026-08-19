import { setupWorker } from "msw/browser";
import { handlers, portalHandlers } from "./handlers";

export const worker = setupWorker(
  ...(import.meta.env.MODE === "integrated" ? portalHandlers : handlers),
);
