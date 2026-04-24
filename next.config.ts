import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "export",
  distDir: process.env.NODE_ENV === "production" ? "docs" : ".next",
  cleanDistDir: true,
  turbopack: {
    root: configDir,
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        allowedDevOrigins: [
          "192.168.*.*",
          "10.*.*.*",
          "172.16.*.*",
          "172.17.*.*",
          "172.18.*.*",
          "172.19.*.*",
          "172.20.*.*",
          "172.21.*.*",
          "172.22.*.*",
          "172.23.*.*",
          "172.24.*.*",
          "172.25.*.*",
          "172.26.*.*",
          "172.27.*.*",
          "172.28.*.*",
          "172.29.*.*",
          "172.30.*.*",
          "172.31.*.*",
        ],
      }
    : {}),
};

export default nextConfig;
