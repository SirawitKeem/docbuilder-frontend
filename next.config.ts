import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pptxgenjs"],
  allowedDevOrigins: ["192.168.5.78"],
};

export default nextConfig;
