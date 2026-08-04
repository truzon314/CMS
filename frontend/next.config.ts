import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
