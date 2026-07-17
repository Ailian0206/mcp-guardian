import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SERVER_KEY = "mcp-guardian";

/** 从 gateway dist|src 下的本文件定位 monorepo 根目录（上三级） */
export function detectRepoRoot(fromFile = fileURLToPath(import.meta.url)): string {
  return path.resolve(path.dirname(fromFile), "../../..");
}

export function guardianHome(): string {
  const dir = process.env.MCP_GUARDIAN_HOME ?? path.join(os.homedir(), ".mcp-guardian");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * 写出用户级 config（绝对路径）。
 * 默认挂上 demo-fs / demo-shell / demo-http，IDE 才能验 allow/deny/redact/审批。
 */
export function writeUserConfig(repoRoot: string): string {
  const home = guardianHome();
  const policy = path.join(repoRoot, "policies/default.fail-closed.yaml");
  const demoFs = path.join(repoRoot, "packages/demo-servers/dist/fs.js");
  const demoShell = path.join(repoRoot, "packages/demo-servers/dist/shell-bin.js");
  const demoHttp = path.join(repoRoot, "packages/demo-servers/dist/http-bin.js");
  const cli = path.join(repoRoot, "packages/gateway/dist/cli.js");
  for (const p of [policy, demoFs, demoShell, demoHttp, cli]) {
    if (!fs.existsSync(p)) {
      throw new Error(`缺少构建产物: ${p}（请先在仓库根执行 pnpm build）`);
    }
  }
  const configPath = path.join(home, "mcp-guardian.config.yaml");
  // 多下游时工具名会暴露为 server__tool；策略仍按 server/tool 匹配
  const yaml = `policyFile: ${JSON.stringify(policy)}
downstreams:
  - name: demo-fs
    command: node
    args:
      - ${JSON.stringify(demoFs)}
  - name: demo-shell
    command: node
    args:
      - ${JSON.stringify(demoShell)}
  - name: demo-http
    command: node
    args:
      - ${JSON.stringify(demoHttp)}
`;
  fs.writeFileSync(configPath, yaml, "utf8");
  return configPath;
}

export type InstallTargets = { cursor: boolean; codex: boolean };

export type InstallResult = {
  configPath: string;
  cliPath: string;
  cursorPath?: string;
  codexPath?: string;
  messages: string[];
};

function cursorMcpPath(): string {
  return path.join(os.homedir(), ".cursor", "mcp.json");
}

function codexConfigPath(): string {
  return path.join(os.homedir(), ".codex", "config.toml");
}

function mergeCursorMcp(cliPath: string, configPath: string): string {
  const file = cursorMcpPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let root: { mcpServers?: Record<string, unknown> } = {};
  if (fs.existsSync(file)) {
    root = JSON.parse(fs.readFileSync(file, "utf8")) as typeof root;
  }
  root.mcpServers = root.mcpServers ?? {};
  root.mcpServers[SERVER_KEY] = {
    command: "node",
    args: [cliPath, "start", "--config", configPath],
  };
  // 备份再写，避免弄坏用户其它 MCP
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, `${file}.bak-mcp-guardian`);
  }
  fs.writeFileSync(file, `${JSON.stringify(root, null, 2)}\n`, "utf8");
  return file;
}

/** 粗粒度 TOML：插入或替换 [mcp_servers.mcp-guardian] 块 */
function mergeCodexToml(cliPath: string, configPath: string): string {
  const file = codexConfigPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, `${file}.bak-mcp-guardian`);
  }

  const block = `[mcp_servers.${SERVER_KEY}]
command = "node"
args = [
  ${JSON.stringify(cliPath)},
  "start",
  "--config",
  ${JSON.stringify(configPath)},
]
`;

  const sectionRe =
    /\[mcp_servers\.mcp-guardian\][\s\S]*?(?=\n\[|\n*$)/;
  if (sectionRe.test(text)) {
    text = text.replace(sectionRe, block.trimEnd());
  } else if (/\[mcp_servers\]/.test(text)) {
    text = text.replace(/\[mcp_servers\]/, `[mcp_servers]\n\n${block.trimEnd()}`);
  } else {
    text = `${text.trimEnd()}\n\n[mcp_servers]\n\n${block}`;
  }
  fs.writeFileSync(file, `${text.trimEnd()}\n`, "utf8");
  return file;
}

/**
 * 一键接入 Cursor / Codex：写用户配置并合并 MCP 客户端配置。
 */
export function installClients(
  targets: InstallTargets,
  repoRoot = detectRepoRoot(),
): InstallResult {
  if (!targets.cursor && !targets.codex) {
    throw new Error("请至少指定 --cursor 或 --codex");
  }
  const configPath = writeUserConfig(repoRoot);
  const cliPath = path.join(repoRoot, "packages/gateway/dist/cli.js");
  const messages: string[] = [
    `用户配置: ${configPath}`,
    "主路径：Cursor/Codex 里用 Agent；高危时 Agent 会问你，再调 guardian_decide（需 confirm_code）。",
    "默认下游：demo-fs / demo-shell / demo-http（多下游时工具名为 server__tool）。",
    "Web 仅介绍/FAQ，不是审批台。",
  ];
  const result: InstallResult = { configPath, cliPath, messages };

  if (targets.cursor) {
    result.cursorPath = mergeCursorMcp(cliPath, configPath);
    messages.push(`已写入 Cursor MCP: ${result.cursorPath}（备份 .bak-mcp-guardian）`);
    messages.push("请重启 Cursor 或 Reload MCP，列表中应出现 mcp-guardian。");
  }
  if (targets.codex) {
    result.codexPath = mergeCodexToml(cliPath, configPath);
    messages.push(`已写入 Codex: ${result.codexPath}（备份 .bak-mcp-guardian）`);
    messages.push("请重启 Codex / 新开会话后使用 mcp-guardian。");
  }
  return result;
}
