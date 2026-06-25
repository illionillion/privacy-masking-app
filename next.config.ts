import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() || randomUUID();

const withSerwist = withSerwistInit({
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

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
          ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
        ],
      }
    : {}),
  images: { unoptimized: true },
};

export default withSerwist(nextConfig);
