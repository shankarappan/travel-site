import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@travel/domain', '@travel/observability', '@travel/db'],
};

export default nextConfig;
