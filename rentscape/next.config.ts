// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
//My edits
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pg', 'pg-native', 'pg-pool'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig