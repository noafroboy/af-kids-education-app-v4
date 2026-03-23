import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  images: {
    domains: [],
    unoptimized: true,
  },
};

export default nextConfig;
