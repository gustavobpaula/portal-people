import { createServer } from "node:http";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, normalize } from "node:path";
import { gzipSync } from "node:zlib";
import { chromium } from "playwright";
import {
  evaluateBudget,
  federatedRemoteNames,
  rewriteRemoteEntries,
  summarizeResponses,
} from "./performance-budgets.mjs";
import { includesProject, selectedProjects } from "./verify-projects.mjs";

const manifestPath = "apps/portal-host/src/assets/journey-registry.json";

const typeFor = (path) =>
  ({
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".html": "text/html",
  })[extname(path)] ?? "application/octet-stream";

async function staticApp(name, registry) {
  const root = join(process.cwd(), "dist/apps", name);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (name === "portal-host" && url.pathname === "/api/journeys") {
      response.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Timing-Allow-Origin": "*",
      });
      response.end(JSON.stringify(registry()));
      return;
    }
    const requested =
      url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const target = normalize(join(root, requested));
    if (!target.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    try {
      let body = await readFile(target);
      if (basename(target) === "mf-manifest.json")
        body = Buffer.from(registry.rewriteManifest(body.toString()));
      const compressed = gzipSync(body);
      response.writeHead(200, {
        "Content-Type": typeFor(target),
        "Content-Encoding": "gzip",
        "Content-Length": compressed.length,
        "Cache-Control": "public, max-age=600",
        "Access-Control-Allow-Origin": "*",
        "Timing-Allow-Origin": "*",
      });
      response.end(compressed);
    } catch {
      if (name === "portal-host") {
        const body = await readFile(join(root, "index.html"));
        const compressed = gzipSync(body);
        response.writeHead(200, {
          "Content-Type": "text/html",
          "Content-Encoding": "gzip",
          "Content-Length": compressed.length,
          "Timing-Allow-Origin": "*",
        });
        response.end(compressed);
      } else response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}

const recordsFor = async (page, action) => {
  const records = [];
  const onResponse = async (response) => {
    const type = response.request().resourceType();
    if (!["script", "stylesheet", "document"].includes(type)) return;
    try {
      records.push({
        url: response.url(),
        type,
        gzipBytes: gzipSync(await response.body()).length,
      });
    } catch {
      /* failed network requests do not count */
    }
  };
  page.on("response", onResponse);
  await action();
  await page.waitForLoadState("networkidle");
  page.off("response", onResponse);
  return records;
};

let browser;
const servers = [];
try {
  const selection = selectedProjects();
  const locations = {};
  const registryJson = await readFile(manifestPath, "utf8");
  const registeredJourneys = JSON.parse(registryJson);
  const remoteNames = federatedRemoteNames(registeredJourneys);
  const originalEntries = Object.fromEntries(
    registeredJourneys
      .filter((journey) => journey.strategy === "federated-module")
      .map((journey) => [
        journey.remote.entry.replace(/\/mf-manifest\.json$/, ""),
        journey.remote.name,
      ]),
  );
  const registry = () =>
    registeredJourneys.map((journey) =>
      journey.strategy === "federated-module"
        ? {
            ...journey,
            remote: {
              ...journey.remote,
              entry: `${locations[journey.remote.name]}/mf-manifest.json`,
            },
          }
        : journey,
    );
  registry.rewriteManifest = (text) =>
    rewriteRemoteEntries(
      text,
      Object.fromEntries(
        Object.entries(originalEntries).map(([entry, name]) => [
          entry,
          locations[name],
        ]),
      ),
    );
  for (const app of remoteNames) {
    await access(join(process.cwd(), "dist/apps", app, "mf-manifest.json"));
    const server = await staticApp(app, registry);
    servers.push(server);
    locations[app] = server.url;
  }
  const host = await staticApp("portal-host", registry);
  servers.push(host);
  locations["portal-host"] = host.url;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const initial = await recordsFor(page, () => page.goto(`${host.url}/`));
  const reports = [
    {
      route: "/",
      category: "shellJs",
      resources: initial.filter((item) => item.type === "script"),
      bytes: summarizeResponses(initial, ".js"),
    },
    {
      route: "/",
      category: "initialTotal",
      resources: initial,
      bytes: initial.reduce((total, item) => total + item.gzipBytes, 0),
    },
    {
      route: "/",
      category: "routeCss",
      resources: initial.filter((item) => item.type === "stylesheet"),
      bytes: summarizeResponses(initial, ".css"),
    },
  ];
  for (const journey of registry().filter(
    (item) =>
      item.strategy === "federated-module" &&
      includesProject(selection, item.remote.name),
  )) {
    const incremental = await recordsFor(page, async () => {
      await page.evaluate((route) => {
        history.pushState({}, "", route);
        dispatchEvent(new PopStateEvent("popstate"));
      }, journey.route);
      await page.waitForTimeout(750);
    });
    reports.push({
      route: journey.route,
      category: "remoteJs",
      resources: incremental.filter((item) => item.type === "script"),
      bytes: summarizeResponses(incremental, ".js"),
    });
    reports.push({
      route: journey.route,
      category: "routeCss",
      resources: incremental.filter((item) => item.type === "stylesheet"),
      bytes: summarizeResponses(incremental, ".css"),
    });
  }
  for (const report of reports)
    report.result = evaluateBudget(report.category, report.bytes);
  console.table(
    reports.map(({ route, category, bytes, result }) => ({
      route,
      category,
      gzipKiB: (bytes / 1024).toFixed(1),
      result,
    })),
  );
  await mkdir("dist/quality", { recursive: true });
  await writeFile(
    "dist/quality/performance-budgets.json",
    `${JSON.stringify(reports, null, 2)}\n`,
  );
  if (reports.some((report) => report.result === "blocking"))
    throw new Error("Um budget bloqueante foi excedido.");
  if (reports.some((report) => report.result === "warning"))
    console.warn("Há budgets em alerta.");
} finally {
  await browser?.close();
  await Promise.allSettled(servers.reverse().map((server) => server.close()));
}
