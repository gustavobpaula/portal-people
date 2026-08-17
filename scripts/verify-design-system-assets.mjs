import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const roots = [
  "libs/design-tokens/src",
  "libs/design-system-web/src",
  "apps/design-system-docs",
];
const forbidden = [
  /@import\s+url\s*\(/i,
  /url\s*\(\s*['"]?https?:/i,
  /https?:\/\/[^\s'")]*itau/i,
  /fonts\.googleapis\.com/i,
];
const allowedExtensions = new Set([".ts", ".tsx", ".scss", ".mdx"]);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? filesIn(join(directory, entry.name))
        : [join(directory, entry.name)],
    ),
  );
  return nested.flat();
}

const files = (await Promise.all(roots.map(filesIn)))
  .flat()
  .filter((file) => allowedExtensions.has(file.slice(file.lastIndexOf("."))));
const violations = [];
for (const file of files) {
  const content = await readFile(file, "utf8");
  if (forbidden.some((expression) => expression.test(content)))
    violations.push(file);
}

if (violations.length) {
  console.error(
    `Design System contains forbidden external asset references:\n${violations.join("\n")}`,
  );
  process.exit(1);
}
console.log(
  `Verified ${files.length} Design System source files: no official or remote asset references.`,
);
