import { spawn } from "node:child_process";
import { once } from "node:events";

const entry = "dist/apps/journey-registry/main.js";

async function waitForRegistry(port) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/journeys`);
      if (response.ok) return;
    } catch {
      // The executable is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Journey Registry did not start.");
}

/** Starts the compiled Registry as a separate process for demos and browser verification. */
export async function startJourneyRegistry(port = 4204) {
  const child = spawn(process.execPath, [entry], {
    cwd: globalThis.process.cwd(),
    env: { ...globalThis.process.env, JOURNEY_REGISTRY_PORT: String(port) },
    stdio: "inherit",
  });
  await waitForRegistry(port);
  return {
    async close() {
      if (child.exitCode !== null) return;
      child.kill("SIGTERM");
      await once(child, "exit");
    },
  };
}
