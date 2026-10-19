import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // youtubei.js — не бандлим, грузим как обычный node-модуль на сервере
  serverExternalPackages: ["youtubei.js"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
