import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@travel/domain',
    '@travel/api-contracts',
    '@travel/providers',
    '@travel/ai',
    '@travel/observability',
  ],
};

export default nextConfig;
