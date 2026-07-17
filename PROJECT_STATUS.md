# PROJECT_STATUS：MCP Guardian

更新时间：2026-07-17  
当前阶段：**里程碑 A — 真实下游（官方 Filesystem MCP）开发中**  
决策：[`docs/product-redesign-2026-07-16.md`](docs/product-redesign-2026-07-16.md)

## 本里程碑交付

- `--profile filesystem --workspace <dir>` 写入官方 `@modelcontextprotocol/server-filesystem`
- `policies/filesystem.fail-closed.yaml`：读 allow；系统路径写 deny；工作区写/改/移 require_approval
- 修复 scoped npm 包名被误 resolve 的 bug
- `scenarios/real-filesystem.sh` 自测

## 验证

```bash
bash scenarios/real-filesystem.sh
```

## PR 红线

真里程碑才开 PR；开则 Claude 只审一次 → 修 → 合闭环。
