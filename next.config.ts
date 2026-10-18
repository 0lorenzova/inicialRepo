import type { NextConfig } from "next";
import { version } from "./package.json";

const revision = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString(),
    NEXT_PUBLIC_APP_VERSION: revision ? `${version} · ${revision}` : version,
  },
};

export default nextConfig;
