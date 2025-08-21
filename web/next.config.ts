import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['@react-three/fiber', '@react-three/drei', 'three'],
  },
  images: {
    domains: [],
    unoptimized: false,
  },
  // Ensure proper handling of static assets
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  // Optimize for production
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
