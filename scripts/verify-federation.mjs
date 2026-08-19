import { access, readFile } from "node:fs/promises";

const artifacts = [
  "dist/apps/portal-host/index.html",
  "dist/apps/neutral-remote/mf-manifest.json",
  "dist/apps/beneficios/mf-manifest.json",
  "dist/apps/ferias/mf-manifest.json",
];
for (const artifact of artifacts) await access(artifact);
const registry = JSON.parse(
  await readFile("apps/portal-host/src/assets/journey-registry.json", "utf8"),
);
for (const domain of ["beneficios", "ferias"]) {
  const manifest = JSON.parse(
    await readFile(`journeys/${domain}/manifest.json`, "utf8"),
  );
  const registryManifest = registry.find((entry) => entry.id === domain);
  if (JSON.stringify(registryManifest) !== JSON.stringify(manifest)) {
    throw new Error(
      `O manifesto de ${domain} diverge do registro local do host.`,
    );
  }
}
console.log(
  "Artefatos do host e dos remotes foram produzidos de forma independente e os manifestos de domínio estão registrados.",
);
