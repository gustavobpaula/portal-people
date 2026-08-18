import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, normalize } from "node:path";

const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));
const fixtureRoot = join(workspaceRoot, "fixtures/holerite-legado");
const allowedReturnUrl = "http://localhost:4200/retorno/holerite-legado";

function contentType(pathname) {
  if (pathname.endsWith(".css")) return "text/css; charset=utf-8";
  if (pathname.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "text/html; charset=utf-8";
}

function safeReturnUrl(value) {
  return value === allowedReturnUrl ? value : "http://localhost:4200/";
}

export async function startExternalWebServer({ port = 4500 } = {}) {
  const origin = `http://localhost:${port}`;
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", origin);
    const isPage = url.pathname === "/holerite" || url.pathname === "/indisponivel";
    const relativePath = isPage ? "index.html" : url.pathname.slice(1);
    const target = normalize(join(fixtureRoot, relativePath || "index.html"));

    if (target !== fixtureRoot && !target.startsWith(`${fixtureRoot}/`)) {
      response.writeHead(403).end();
      return;
    }

    try {
      let content = await readFile(target);
      if (relativePath === "index.html") {
        const state = url.pathname === "/indisponivel" ? "unavailable" : "ready";
        content = Buffer.from(
          content
            .toString()
            .replace("__LEGACY_STATE__", state)
            .replace("__RETURN_TO__", safeReturnUrl(url.searchParams.get("returnTo"))),
        );
      }
      response.writeHead(200, {
        "Content-Type": contentType(target),
        "Cache-Control": "no-store",
      });
      response.end(content);
    } catch {
      response.writeHead(404).end("Página não encontrada");
    }
  });

  await new Promise((resolve) => server.listen(port, "localhost", resolve));
  return {
    port,
    close: () =>
      new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
