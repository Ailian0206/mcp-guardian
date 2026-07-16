import { expect, test } from "@playwright/test";

// 30–60 秒作品集演示路径：落地页 → 公开 Demo → 单条回放
test.describe("demo walkthrough", () => {
  test("landing → demo list → audit detail", async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "MCP Guardian" })).toBeVisible();
    await page.waitForTimeout(800);

    await page.getByRole("link", { name: "查看公开 Demo" }).click();
    await expect(page.getByRole("heading", { name: "公开 Demo 回放" })).toBeVisible();
    await expect(page.getByText("allow", { exact: true })).toBeVisible();
    await page.waitForTimeout(600);

    const first = page.locator('a[href^="/demo/"]').first();
    await expect(first).toBeVisible();
    await first.click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("demo-");
    await page.waitForTimeout(800);

    await page.getByRole("link", { name: "← Demo" }).click();
    await expect(page.getByRole("heading", { name: "公开 Demo 回放" })).toBeVisible();
    await page.waitForTimeout(500);
  });
});
