import { defineConfig, devices } from "@playwright/test";

const port = 3042;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  testMatch: "demo-walkthrough.spec.ts",
  timeout: 90_000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL,
    video: "on",
    viewport: { width: 1280, height: 720 },
    trace: "off",
  },
  outputDir: "../../docs/assets/playwright-output",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `MCP_GUARDIAN_WEB_DATA=/tmp/mg-demo-record pnpm exec next start --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
