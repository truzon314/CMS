import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output: a minimal, self-contained server bundle instead of
  // requiring `node_modules` + the full source tree at runtime — the whole
  // point of a lean production container (GCP_DEPLOYMENT.md §2).
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "truzon-backend-715189721854.asia-south1.run.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "truzon-backend-ajh7cqh7eq-el.a.run.app",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  // Lets other devices on the same WiFi (phones, tablets) reach this dev
  // server and its RSC endpoints — Next.js blocks cross-origin dev requests
  // from any origin not in this list.
  allowedDevOrigins: ["192.168.1.8"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
