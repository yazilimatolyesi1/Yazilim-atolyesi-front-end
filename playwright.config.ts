import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: ".e2e-results/artifacts",
  reporter: [["list"], ["json", { outputFile: ".e2e-results/results.json" }]],
  // Next.js server component'lerinin fetch'i Node icinden gider; `page.route`
  // yalnizca tarayici isteklerini yakalar. Bu yuzden SSR fetch'i mock'lamak icin
  // ayri bir icerik API sunucusu calisir ve `CLUB_API_URL` ona yonlendirilir.
  webServer: [
    {
      command: "node tests/e2e/support/mock-content-api.mjs",
      url: "http://127.0.0.1:9099/__health",
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      // `npm run start:local` = `next start --hostname localhost --port 3001`.
      // Onceden `next build` calismis olmalidir. Bu olmadan testler
      // ERR_CONNECTION_REFUSED ile duserdi.
      command: "npm run start:local",
      url: "http://localhost:3001",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        CLUB_API_URL: process.env.CLUB_API_URL || "http://127.0.0.1:9099/api/v1",
      },
    },
  ],
  use: {
    baseURL: process.env.UI_TEST_URL || "http://localhost:3001",
    ...devices["Desktop Chrome"],
    screenshot: "only-on-failure",
    trace: "off",
  },
});
