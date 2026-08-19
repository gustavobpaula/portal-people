import { spawn } from "node:child_process";

const command = process.argv[2] ?? "full";
const args = process.argv.slice(3);
const run = (commandLine, commandArgs = [], capture = false) =>
  new Promise((resolve, reject) => {
    const [bin, ...prefix] = commandLine.split(" ");
    const child = spawn(bin, [...prefix, ...commandArgs], {
      stdio: capture ? "pipe" : "inherit",
      shell: process.platform === "win32",
    });
    let output = "";
    child.stdout?.on("data", (chunk) => {
      output += chunk;
    });
    child.once("exit", (code) =>
      code === 0
        ? resolve(output)
        : reject(new Error(`${commandLine} falhou com código ${code}`)),
    );
    child.once("error", reject);
  });

const delivery = [
  "pnpm verify:design-system-assets",
  "pnpm verify:federation",
  "pnpm verify:performance-budgets",
  "pnpm verify:shell",
  "pnpm verify:journey-registry",
  "pnpm verify:external-web",
  "pnpm verify:web-mobile-bridge",
  "pnpm verify:observability",
  "pnpm verify:accessibility",
];
const full = [
  "pnpm lint",
  "pnpm typecheck",
  "pnpm test",
  "pnpm build",
  ...delivery,
];
const affectedArgs = args.length ? args : ["--base=origin/main", "--head=HEAD"];
const affected = [
  "pnpm nx affected -t lint,test,build",
  "pnpm typecheck",
  ...delivery,
];
const sequence =
  command === "delivery" ? delivery : command === "affected" ? affected : full;
if (command === "affected") {
  const output = await run(
    "pnpm nx show projects --affected",
    affectedArgs,
    true,
  );
  const projects = output.trim().split(/\s+/).filter(Boolean).join(",");
  if (!projects) throw new Error("Nenhum projeto afetado foi encontrado.");
  await run("pnpm nx run-many -t lint,test,build", [`--projects=${projects}`]);
  for (const entry of affected.slice(1)) await run(entry);
} else {
  for (const entry of sequence) await run(entry);
}
