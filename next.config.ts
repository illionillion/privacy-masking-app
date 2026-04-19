import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: process.env.NODE_ENV === "production" ? "docs" : ".next",
  cleanDistDir: true,
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
