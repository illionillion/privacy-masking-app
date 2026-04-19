import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: process.env.NODE_ENV === "production" ? "docs" : ".next",
  cleanDistDir: false,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
