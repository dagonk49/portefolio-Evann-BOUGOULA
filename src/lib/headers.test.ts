import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("en-têtes de sécurité", () => {
  it("nginx et le serveur de prévisualisation envoient les mêmes en-têtes", () => {
    const json = JSON.parse(readFileSync("deploy/security-headers.json", "utf8")) as Record<string, string>;
    const inc = readFileSync("deploy/security-headers.inc", "utf8");
    const nginx = Object.fromEntries(
      [...inc.matchAll(/add_header ([\w-]+) "([^"]+)" always;/g)].map((m) => [m[1], m[2]]),
    );
    expect(nginx).toEqual(json);
  });
});
