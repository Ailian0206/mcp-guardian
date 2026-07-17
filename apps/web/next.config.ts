import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mcp-guardian/shared", "@mcp-guardian/policy-engine"],
  // 仓库根已跑 eslint；构建时跳过 Next 内置 ESLint，避免无 next 插件的误导警告
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
