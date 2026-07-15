import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  serverExternalPackages: ["@libsql/client"],
  webpack: (config, { webpack }) => {
    // @block65/webcrypto-web-push has a dynamic `import("node:crypto")` fallback
    // that only runs if globalThis.crypto is missing (never true on edge/browser/
    // modern Node) — but webpack still tries to statically resolve it. Drop it.
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^node:crypto$/ }));
    return config;
  },
};

export default nextConfig;