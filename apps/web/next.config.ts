import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  transpilePackages: ["@mcp-guardian/shared", "@mcp-guardian/policy-engine"],
  // 仓库根已跑 eslint；构建时跳过 Next 内置 ESLint，避免无 next 插件的误导警告
  eslint: { ignoreDuringBuilds: true },
  ...(isGitHubPages
    ? {
        output: "export" as const,
        trailingSlash: true,
      }
    : {}),
  basePath: isGitHubPages ? "/mcp-guardian" : "",
  assetPrefix: isGitHubPages ? "/mcp-guardian/" : "",
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: isGitHubPages ? "/mcp-guardian" : "",
  },
};

export default nextConfig;
