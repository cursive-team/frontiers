/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Needed to make snarkJs work client side
    config.resolve.fallback = {
      net: false,
      tls: false,
      fs: false,
      readline: false,
    };
    return config;
  },
  images: {
    domains: ["fnhxjtmpinl8vxmj.public.blob.vercel-storage.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  headers: async () => {
    // needed to allow calls by wasm to remote resources
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
