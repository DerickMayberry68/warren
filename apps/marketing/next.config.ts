import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@warren/ui", "@warren/supabase"],
};

export default nextConfig;
