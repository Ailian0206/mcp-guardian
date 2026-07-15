import { defineConfig, devices } from "@playwright/test";

// 固定用 3041，避免与本地 `pnpm dev:web`（3040）抢端口/误复用
const port = 3041;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `MCP_GUARDIAN_WEB_DATA=/tmp/mg-pw-e2e pnpm exec next start --port ${port}`,
    url: baseURL,
    // 禁止复用开发机上的其它 Next 进程，保证数据目录隔离
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
