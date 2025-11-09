import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
    ],
  },
  webpack: (config, { isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization = config.optimization || {};
      if (
        !config.optimization.splitChunks ||
        typeof config.optimization.splitChunks === "boolean"
      ) {
        config.optimization.splitChunks = {
          chunks: "all",
          cacheGroups: {},
        };
      }
      config.optimization.splitChunks.chunks = "all";
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all",
          priority: 10,
        },
        tiptap: {
          test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
          name: "tiptap",
          chunks: "all",
          priority: 20,
        },
        react: {
          test: /[\\/]node_modules[\\/]react/,
          name: "react",
          chunks: "all",
          priority: 30,
        },
      };
    }
    return config;
  },
};

export default bundleAnalyzer(nextConfig);
