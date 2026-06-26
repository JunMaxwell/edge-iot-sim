import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Anchor file tracing to the monorepo root so the standalone bundle uses a
  // predictable path (apps/web/server.js) regardless of where the repo lives
  // on the host machine — critical for Docker builds.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
};

export default nextConfig;
