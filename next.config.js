/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable experimental features for App Router
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_APP_NAME: 'Sovereign Reserve Agent',
    NEXT_PUBLIC_VERSION: '2.0.0',
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle node modules that need polyfills in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
