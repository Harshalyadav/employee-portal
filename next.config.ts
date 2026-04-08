import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker optimization
  output: 'standalone',
  
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
  images: {

    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS hosts
      },
      {
        protocol: 'http',
        hostname: '**', // Allow all HTTP hosts
      },
    ],
  },

};

export default nextConfig;
