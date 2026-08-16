import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@travel/domain', '@travel/observability'],
};

export default nextConfig;
