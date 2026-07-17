import { expect, test } from "@playwright/test";

test.describe("Week4 smoke", () => {
  test("落地页展示品牌与价值主张", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "MCP Guardian" })).toBeVisible();
    await expect(page.getByText("与 Trace 平台的差异")).toBeVisible();
    await expect(page.getByText("一键安装")).toBeVisible();
  });

  test("公开 Demo 可回放且含统计", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.getByRole("heading", { name: /公开 Demo/ })).toBeVisible();
    await expect(page.getByText("现场试跑策略")).toBeVisible();
    // 统计卡用 exact，避免与列表里同名 action 撞 strict mode
    await expect(page.getByText("allow", { exact: true })).toBeVisible();
    await expect(page.getByText("deny", { exact: true })).toBeVisible();
    await expect(page.getByText("redact", { exact: true })).toBeVisible();
    await expect(page.getByText("require_approval", { exact: true })).toBeVisible();
    await expect(page.locator('a[href^="/demo/"]')).not.toHaveCount(0);
  });

  test("未登录访问 /app 跳转登录门禁", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "登录 Dashboard" })).toBeVisible();
  });
});
