import { describe, expect, it } from "vitest";
import {
  evaluateBudget,
  federatedRemoteNames,
  KIB,
  rewriteRemoteEntries,
  summarizeResponses,
} from "../../scripts/performance-budgets.mjs";

describe("performance budgets", () => {
  it("classifies normal, warning and blocking values", () => {
    expect(evaluateBudget("shellJs", 179 * KIB)).toBe("ok");
    expect(evaluateBudget("shellJs", 181 * KIB)).toBe("warning");
    expect(evaluateBudget("shellJs", 201 * KIB)).toBe("blocking");
  });
  it("deduplicates renamed or repeated response URLs before summing chunks", () => {
    expect(
      summarizeResponses(
        [
          { url: "http://a/one.js", gzipBytes: 10 },
          { url: "http://a/two.js", gzipBytes: 20 },
          { url: "http://a/one.js", gzipBytes: 10 },
        ],
        ".js",
      ),
    ).toBe(30);
  });
  it("discovers every registered federated remote and rewrites only its in-memory origin", () => {
    const registry = [
      {
        strategy: "federated-module",
        remote: {
          name: "beneficios",
          entry: "http://localhost:4300/mf-manifest.json",
        },
      },
      {
        strategy: "federated-module",
        remote: {
          name: "novo-remote",
          entry: "http://localhost:4400/mf-manifest.json",
        },
      },
      { strategy: "external-web" },
    ];
    expect(federatedRemoteNames(registry)).toEqual([
      "beneficios",
      "novo-remote",
    ]);
    expect(
      rewriteRemoteEntries("http://localhost:4300/assets/a.js", {
        "http://localhost:4300": "http://127.0.0.1:5010",
      }),
    ).toBe("http://127.0.0.1:5010/assets/a.js");
  });
});
