import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@travel/domain', '@travel/observability', '@travel/consent'],
};

export default nextConfig;
