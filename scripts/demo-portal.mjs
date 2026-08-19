import { closeOnSignal, startPortalStack } from "./portal-stack.mjs";

const stack = await startPortalStack();

console.log("Portal Pessoas: http://localhost:4200");
console.log("Holerite legado: abra o portal e selecione ‘Holerite legado’.");
console.log("Falha externa demonstrável: http://localhost:4500/indisponivel");

closeOnSignal(stack);
