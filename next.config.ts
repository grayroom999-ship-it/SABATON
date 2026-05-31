import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.image2url.com',
        // Optional: restrict to specific path
        // pathname: '/r2/default/images/**',
      },
    ],
  },
  
  // Your existing config below
  experimental: {
    // Only put valid Next.js experimental features here (e.g., ppr, turbo? but turbo is not a key)
    // Leave empty or omit entirely if you don't need any
  },
  webpack: (config) => {
    config.plugins.push(
      new (class {
        apply(compiler: any) {
          compiler.hooks.done.tap("ErrorHandler", (stats: any) => {
            if (stats.hasErrors()) {
              console.error("Webpack errors:", stats.compilation.errors);
            }
          });
        }
      })()
    );
    return config;
  },
  turbopack: {},  // This is fine; Next.js ignores unknown keys but keep if you like
};

export default nextConfig;