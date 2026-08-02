/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // O build não falha por avisos de lint (ex.: uso de <img>).
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
