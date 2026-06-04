/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: false,
  },
  reactStrictMode: true,

  serverExternalPackages: ['pdf-parse'],
  
  // Compression
  compress: true,
  
  // PoweredBy header removal for security
  poweredByHeader: false,
  
  // Webpack configuration to handle parsing issues
  webpack: (config, { isServer }) => {
    // Fix for SWC parsing issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
      };
    }
    // Exclude pdf-parse from bundling on server side to avoid class constructor errors
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('pdf-parse');
      } else if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = (context, request, callback) => {
          if (request === 'pdf-parse') {
            return callback(null, 'commonjs pdf-parse');
          }
          return originalExternals(context, request, callback);
        };
      } else {
        config.externals['pdf-parse'] = 'commonjs pdf-parse';
      }
    }
    return config;
  },
  
  // Headers for SEO and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/:path*.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/:path*.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
  
  // Redirects for SEO (if needed)
  async redirects() {
    return [
      {
        source: '/exam/exam-com',
        destination: '/exam/exam-con',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
