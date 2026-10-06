import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Profile photos used by the sample UIs
    remotePatterns: [new URL("https://lh3.googleusercontent.com/aida-public/**")],
  },
};

export default nextConfig;
