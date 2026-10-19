import type { NextConfig } from "next";

/*
  Политика безопасности контента (CSP): что странице разрешено грузить.
  - скрипты: свои + YouTube IFrame API (inline нужен для скрипта темы и самого Next.js);
  - фреймы: только плеер YouTube (без cookies — youtube-nocookie.com);
  - картинки и звук: с любых https — обложки и треки приходят с десятков узлов Audius/Deezer/Google;
  - встраивать наш сайт в чужие страницы нельзя (frame-ancestors 'none').
  В dev-режиме CSP не ставим: горячей перезагрузке нужен eval.
*/
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  ...(process.env.NODE_ENV === "production" ? [{ key: "Content-Security-Policy", value: csp }] : []),
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  // youtubei.js — не бандлим, грузим как обычный node-модуль на сервере
  serverExternalPackages: ["youtubei.js"],
  partialPrefetching: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
