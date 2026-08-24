import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@braincrew/ui", "@braincrew/contracts"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.braincrew.ai" },
    ],
  },
};

export default nextConfig;
