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
        allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*"],
      }
    : {}),
};

export default nextConfig;
