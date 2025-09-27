import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["static.usernames.app-backend.toolsforhumanity.com"],
  },
  allowedDevOrigins: ["*"], // Add your dev origin here
  reactStrictMode: false,
  // Disable ESLint and TypeScript checks during build for hackathon
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
