/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['better-sqlite3'],
  turbopack: {},
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'better-sqlite3': 'commonjs better-sqlite3' }];
    return config;
  },
};

export default nextConfig;
