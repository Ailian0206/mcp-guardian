#!/usr/bin/env node
/**
 * GitHub Pages 静态导出：临时挪走依赖 Node 的 app/api、Dashboard、login，
 * 只发布说明书门面（/ /faq /demo）。构建结束后还原。
 */
import { existsSync } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const stashRoot = path.join(root, ".pages-stash");

const toStash = [
  { from: path.join(root, "src/app/api"), name: "api" },
  { from: path.join(root, "src/app/app"), name: "app" },
  { from: path.join(root, "src/app/login"), name: "login" },
];

async function main() {
  /** @type {{ from: string, name: string }[]} */
  const moved = [];
  try {
    await rm(stashRoot, { recursive: true, force: true });
    await mkdir(stashRoot, { recursive: true });

    for (const item of toStash) {
      if (existsSync(item.from)) {
        await rename(item.from, path.join(stashRoot, item.name));
        moved.push(item);
      }
    }

    const result = spawnSync("pnpm", ["exec", "next", "build"], {
      stdio: "inherit",
      env: { ...process.env, GITHUB_PAGES: "true" },
      shell: process.platform === "win32",
    });
    process.exitCode = result.status ?? 1;
  } finally {
    for (const item of [...moved].reverse()) {
      const dest = path.join(stashRoot, item.name);
      if (existsSync(dest)) {
        await rename(dest, item.from);
      }
    }
    await rm(stashRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
