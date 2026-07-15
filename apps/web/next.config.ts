import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mcp-guardian/shared", "@mcp-guardian/policy-engine"],
};

export default nextConfig;
