import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout sur l'export statique (`npm run build` d'abord).
 * PLAYWRIGHT_CHROMIUM : chemin optionnel vers un Chromium déjà installé.
 * Le rendu WebGL passe par SwiftShader (logiciel) : les tests du lab sont
 * volontairement tolérants sur les délais.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM || undefined;
const port = Number(process.env.E2E_PORT ?? 4310);

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "off",
    launchOptions: {
      executablePath,
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
    },
  },
  webServer: {
    command: `node scripts/serve.mjs ${port} out`,
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec/ },
  ],
});
