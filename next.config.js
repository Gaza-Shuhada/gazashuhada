/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['img.clerk.com', 'images.unsplash.com'],
  },
  // Increase body size limit for large CSV uploads (App Router)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        // Increase body size limit for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Body-Size-Limit',
            value: '10485760', // 10MB in bytes
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
