import { expect, test } from "@playwright/test";

// 作品集演示路径：落地页 → Demo → 单条回放（文案随产品再定位更新）
test.describe("demo walkthrough", () => {
  test("landing → demo list → audit detail", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "MCP Guardian" })).toBeVisible();
    await expect(page.getByText("一键安装")).toBeVisible();

    await page.getByRole("link", { name: "浏览器里试跑策略" }).click();
    await expect(page.getByRole("heading", { name: /公开 Demo/ })).toBeVisible();
    await expect(page.getByText("现场试跑策略")).toBeVisible();
    await expect(page.getByText("allow", { exact: true })).toBeVisible();

    const first = page.locator('a[href^="/demo/"]').first();
    await expect(first).toBeVisible();
    await first.click();

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("link", { name: "← Demo" }).click();
    await expect(page.getByRole("heading", { name: /公开 Demo/ })).toBeVisible();
  });
});
