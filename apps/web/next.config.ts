import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Only transpile internal workspace packages.
  // Do NOT add npm packages like three, @react-three/*, postprocessing here —
  // it causes Webpack to try to server-bundle them which crashes the API routes.
  transpilePackages: [
    '@booxury/three',
    '@booxury/spine-calc',
    '@booxury/pricing-engine',
    '@booxury/design-types',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
  // Externalize all packages that are client-only or cause server-side issues.
  // These are never used server-side (always behind dynamic(..., { ssr: false })).
  serverExternalPackages: [
    'konva',
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    '@react-three/postprocessing',
    'postprocessing',
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Stub client-only packages that must never be resolved server-side.
      config.resolve.alias = {
        ...config.resolve.alias,
        konva: false,
        three: false,
        '@react-three/fiber': false,
        '@react-three/drei': false,
        '@react-three/postprocessing': false,
        postprocessing: false,
      };
    }
    return config;
  },
};

export default nextConfig;
