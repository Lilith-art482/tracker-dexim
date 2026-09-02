import type { NextConfig } from "next";

const basePath =
  process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : "";

const nextConfig: NextConfig = {
  output: process.env.OUTPUT_MODE === "export" ? "export" : undefined,

  ...(basePath && {
    basePath,
    assetPrefix: basePath,
  }),

  ...(process.env.OUTPUT_MODE === "export" && {
    images: {
      unoptimized: true,
    },
  }),
  allowedDevOrigins: ["*"],

  devIndicators: false,
  poweredByHeader: false,
  reactStrictMode: true,

  serverExternalPackages: ["firebase-admin", "pdf-parse", "mammoth"],

  async redirects() {
    return [
      {
        source: "/smartclock",
        destination: "/sleep",
        permanent: true,
      },
    ];
  },

  turbopack: {
    root: ".",
  },
};

export default nextConfig;
