import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@travel/domain',
    '@travel/api-contracts',
    '@travel/providers',
    '@travel/ai',
    '@travel/observability',
    '@travel/ui',
    '@travel/consent',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
