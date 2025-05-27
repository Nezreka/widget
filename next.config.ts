import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**', // Allows any path under this hostname
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com', // Added Pexels
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com', // Existing Pixabay CDN
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pixabay.com', // Added base Pixabay domain
        port: '',
        pathname: '/**',
      },
      // You can add other trusted hostnames here if needed
      // For example, if you also load images from 'source.unsplash.com':
      // {
      //   protocol: 'https',
      //   hostname: 'source.unsplash.com',
      //   port: '',
      //   pathname: '/**',
      // },
    ],
    // If you were on an older Next.js version, you might use 'domains' instead:
    // domains: ['images.unsplash.com', 'source.unsplash.com'],
  },
};

export default nextConfig;
