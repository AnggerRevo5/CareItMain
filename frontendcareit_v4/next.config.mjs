/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  output: 'export',
  trailingSlash: false,
  assetPrefix: process.env.NEXT_EXPORT === 'true' ? './' : undefined,
};

export default nextConfig;
