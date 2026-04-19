import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "export",
  distDir: process.env.NODE_ENV === "production" ? "docs" : ".next",
  cleanDistDir: true,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
