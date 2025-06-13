import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Wildcard to allow all hostnames
        port: '',
        pathname: '/**',
      },
    ],
    // If you were on an older Next.js version, you might use 'domains' instead:
    // domains: ['images.unsplash.com', 'source.unsplash.com'],
  },
};

export default nextConfig;
