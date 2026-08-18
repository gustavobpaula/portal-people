import { startExternalWebServer } from "../tools/external-web-demo/server.mjs";

const legacy = await startExternalWebServer();

console.log("Holerite legado: http://localhost:4500/holerite");
console.log("Encerre somente o legado com Ctrl+C.");

const stop = async () => {
  await legacy.close();
  process.exit(0);
};

process.once("SIGINT", stop);
process.once("SIGTERM", stop);
