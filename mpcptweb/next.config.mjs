/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['via.placeholder.com', 'res.cloudinary.com'], // Add any other external image domains here
    formats: ['image/avif', 'image/webp'], // Modern image formats for better performance
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable strict mode
  reactStrictMode: true,
  
  // Exclude pdf-parse from bundling (CommonJS module that doesn't work well when bundled)
  // This prevents the "Class constructor cannot be invoked without 'new'" error
  experimental: {
    serverExternalPackages: ['pdf-parse'],
  },
  
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
        ],
      },
    ];
  },
  
  // Redirects for SEO (if needed)
  async redirects() {
    return [
      // Add any redirects here if needed
      // Example:
      // {
      //   source: '/old-page',
      //   destination: '/new-page',
      //   permanent: true,
      // },
    ];
  },
};

export default nextConfig;
