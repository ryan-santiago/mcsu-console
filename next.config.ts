import type { NextConfig } from "next";

// Baseline security headers (docs/07-conventions.md § Security checklist).
// TODO(1.2b): add a Content-Security-Policy once the PWA service worker lands; it needs a hash for
// the inline palette script in src/app/layout.tsx and `worker-src 'self'`.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Docker runner image ships only .next/standalone (docs/10-docker.md).
  output: "standalone",
  poweredByHeader: false,
  // Cache Components + Partial Prefetching (ADR 0015).
  cacheComponents: true,
  partialPrefetching: true,
  // forbidden() for 403 pages (docs/07 § Errors). Still experimental in Next 16.4.
  experimental: { authInterrupts: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
