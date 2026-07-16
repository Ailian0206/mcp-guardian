# Sentry（可选，部署时启用）

MVP 不强制。若生产需要错误上报：

1. 在 Vercel 项目注入 `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`
2. 再接入 `@sentry/nextjs`（当前未安装，避免本地开发噪音）

本地验收不依赖 Sentry。
