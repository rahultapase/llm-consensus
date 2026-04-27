import type { NextConfig } from "next";
import "./lib/env";

const nextConfig: NextConfig = {
  transpilePackages: ["@llm-consensus/shared"],
};

export default nextConfig;
