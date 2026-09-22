import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions receive passport/medical-record uploads.
    serverActions: { bodySizeLimit: "15mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
