import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Trigger Vercel redeploy
  reactCompiler: true,
  
  // Optimized Cache Control - Cache static assets, fresh dynamic data
  async headers() {
    return [
      {
        // Cache static assets (fonts, images, CSS, JS) aggressively
        source: '/(.*)\\.(woff|woff2|ttf|otf|eot|jpg|jpeg|png|gif|svg|webp|ico|css|js)$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // No cache for API routes and pages
        source: '/(api|dashboard)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  
  // Enable compression
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Production optimizations
  poweredByHeader: false,
  generateEtags: true,
};

export default nextConfig;
