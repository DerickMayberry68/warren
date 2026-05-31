import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@warren/ui", "@warren/supabase", "@warren/db"],
};

export default nextConfig;
