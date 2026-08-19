import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import {
  journeyRegistryResponseSchema,
  type JourneyRegistryResponse,
} from "@portal/platform-contracts";

export const builtCatalogDirectory = fileURLToPath(new URL("./journeys", import.meta.url));

/** Loads independently owned declarations and publishes them only as one valid catalog. */
export async function loadJourneyCatalog(directory = builtCatalogDirectory): Promise<JourneyRegistryResponse> {
  const entries = (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));
  const manifests = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name, "manifest.json");
    try {
      return JSON.parse(await readFile(path, "utf8")) as unknown;
    } catch {
      throw new Error(`Invalid journey declaration: ${entry.name}.`);
    }
  }));
  const parsed = journeyRegistryResponseSchema.safeParse(manifests);
  if (!parsed.success) throw new Error("Journey catalog is invalid.");
  if (parsed.data.some((manifest, index) => manifest.id !== entries[index]?.name)) {
    throw new Error("Journey declaration directory must match its id.");
  }
  return parsed.data;
}
