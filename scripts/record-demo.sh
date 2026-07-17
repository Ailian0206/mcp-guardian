#!/usr/bin/env bash
# 录制 30–60 秒演示视频（webm），可选转 GIF（需 ffmpeg）。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT="$ROOT/docs/assets"
mkdir -p "$OUT/playwright-output"

echo "构建 Web..."
pnpm --filter @mcp-guardian/web build >/dev/null

echo "运行演示 walkthrough（输出到 docs/assets/playwright-output）..."
pnpm --filter @mcp-guardian/web exec playwright test \
  --config playwright.demo.config.ts

WEBM="$(find "$OUT/playwright-output" -name '*.webm' -type f | head -1)"
if [[ -z "$WEBM" ]]; then
  echo "未找到 webm，请检查 playwright-output" >&2
  exit 1
fi
cp "$WEBM" "$OUT/demo-walkthrough.webm"
echo "已保存: docs/assets/demo-walkthrough.webm"

if command -v ffmpeg >/dev/null 2>&1; then
  ffmpeg -y -i "$OUT/demo-walkthrough.webm" \
    -vf "fps=12,scale=960:-1:flags=lanczos" \
    -loop 0 "$OUT/demo-walkthrough.gif" 2>/dev/null
  echo "已保存: docs/assets/demo-walkthrough.gif"
else
  echo "未安装 ffmpeg，跳过 GIF；可用: brew install ffmpeg"
fi

# 落地页播放副本
WEB_PUBLIC="$ROOT/apps/web/public"
mkdir -p "$WEB_PUBLIC"
cp "$OUT/demo-walkthrough.webm" "$WEB_PUBLIC/demo-walkthrough.webm"
[[ -f "$OUT/demo-walkthrough.gif" ]] && cp "$OUT/demo-walkthrough.gif" "$WEB_PUBLIC/demo-walkthrough.gif"
echo "已同步: apps/web/public/demo-walkthrough.*"
