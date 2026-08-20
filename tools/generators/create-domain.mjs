import {
  cp,
  mkdir,
  readFile,
  readdir,
  rename,
  writeFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { registerDomain } from "../domain-governance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const templateRoot = resolve(here, "templates/domain");
const validName = (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value ?? "");
export const humanizeName = (name) =>
  name
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
export function parseDomainArguments(args) {
  const option = (name) => {
    const index = args.indexOf(name);
    return index === -1 ? undefined : args[index + 1];
  };
  const name = option("--name");
  return {
    name,
    displayName:
      option("--display-name") ??
      (validName(name) ? humanizeName(name) : undefined),
    port: Number(option("--port") ?? "4300"),
    dryRun: args.includes("--dry-run"),
  };
}
async function templateFiles(directory = templateRoot, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory())
      files.push(
        ...(await templateFiles(resolve(directory, entry.name), relative)),
      );
    else files.push(relative);
  }
  return files;
}
/** Derives the paths a domain would occupy from the same template the generator copies. */
export async function planDomain(name) {
  const files = await templateFiles();
  return {
    app: {
      root: `apps/${name}`,
      files: files
        .filter((file) => file !== "journey-manifest.json")
        .map((file) =>
          file === "project.json.template" ? "project.json" : file,
        ),
    },
    journey: { root: `journeys/${name}`, files: ["manifest.json"] },
    governance: "tools/domain-governance.json",
  };
}
export function renderTree(files) {
  const root = {};
  for (const file of files)
    file.split("/").reduce((node, part) => (node[part] ??= {}), root);
  const isDirectory = (node) => Object.keys(node).length > 0;
  const lines = [];
  const walk = (node, prefix) => {
    const names = Object.keys(node).sort((left, right) =>
      isDirectory(node[left]) === isDirectory(node[right])
        ? left.localeCompare(right)
        : isDirectory(node[left])
          ? 1
          : -1,
    );
    names.forEach((name, index) => {
      const last = index === names.length - 1;
      lines.push(
        `${prefix}${last ? "└── " : "├── "}${name}${isDirectory(node[name]) ? "/" : ""}`,
      );
      if (isDirectory(node[name]))
        walk(node[name], `${prefix}${last ? "    " : "│   "}`);
    });
  };
  walk(root, "");
  return lines;
}
async function replaceAll(directory, values) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await replaceAll(path, values);
    else
      await writeFile(
        path,
        Object.entries(values).reduce(
          (text, [key, value]) => text.replaceAll(key, value),
          await readFile(path, "utf8"),
        ),
      );
  }
}
export async function createDomain({
  name,
  displayName = humanizeName(name),
  port = 4300,
  workspaceRoot = process.cwd(),
}) {
  if (!validName(name))
    throw new Error(
      "Use --name com um nome kebab-case, por exemplo: beneficios.",
    );
  if (
    !displayName?.trim() ||
    !Number.isInteger(port) ||
    port < 1024 ||
    port > 65535
  )
    throw new Error(
      "Use --display-name não vazio e --port entre 1024 e 65535.",
    );
  const destination = resolve(workspaceRoot, "apps", name);
  if (existsSync(destination)) throw new Error(`O domínio ${name} já existe em apps/${name}. Remova o diretório para recriá-lo.`);
  await mkdir(resolve(workspaceRoot, "apps"), { recursive: true });
  await cp(resolve(here, "templates/domain"), destination, { recursive: true });
  await rename(
    resolve(destination, "project.json.template"),
    resolve(destination, "project.json"),
  );
  await replaceAll(destination, {
    __DOMAIN_NAME__: name,
    __DISPLAY_NAME__: displayName,
    __PORT__: String(port),
    "// @ts-nocheck\n": "",
  });
  const journeyDestination = resolve(workspaceRoot, "journeys", name);
  await mkdir(journeyDestination, { recursive: true });
  await rename(
    resolve(destination, "journey-manifest.json"),
    resolve(journeyDestination, "manifest.json"),
  );
  await registerDomain(workspaceRoot, name);
  return destination;
}
async function describePlan({
  name,
  displayName,
  port,
  workspaceRoot = process.cwd(),
}) {
  const plan = await planDomain(name);
  if (existsSync(resolve(workspaceRoot, plan.app.root))) {
    console.error(`O domínio ${name} já existe em apps/${name}. Remova o diretório para recriá-lo.`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `Simulação: ${name} seria materializado como remote federado na porta ${port}. Nada foi gravado.`,
  );
  console.log("");
  console.log(`${plan.app.root}/`);
  for (const line of renderTree(plan.app.files)) console.log(line);
  console.log(`${plan.journey.root}/`);
  for (const line of renderTree(plan.journey.files)) console.log(line);
  console.log(
    `${plan.governance}  ← ${name} entra no catálogo e passa a valer as fronteiras do workspace`,
  );
  console.log("");
  console.log(
    `Rota /${name} · exibida como "${displayName}" · nenhuma configuração interna do shell seria alterada.`,
  );
}
async function run() {
  const options = parseDomainArguments(process.argv.slice(2));
  try {
    if (
      !validName(options.name) ||
      !options.displayName?.trim() ||
      !Number.isInteger(options.port) ||
      options.port < 1024 ||
      options.port > 65535
    )
      throw new Error(
        "Use --name kebab-case, --display-name não vazio e --port entre 1024 e 65535.",
      );
    if (options.dryRun) return void (await describePlan(options));
    await createDomain(options);
    console.log(
      `Domínio ${options.name} criado. Nenhuma configuração interna do shell foi alterada.`,
    );
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Não foi possível criar o domínio.",
    );
    process.exitCode = 1;
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await run();
