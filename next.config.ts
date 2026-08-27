import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @sparticuz/chromium's compressed binaries (bin/*.br) are loaded from a
  // computed path at runtime, so Next's static file tracer misses them —
  // without this, the PDF route's Chromium executablePath() 404s in prod.
  outputFileTracingIncludes: {
    "/api/proposals/\\[id\\]/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  async headers() {
    return [
      {
        // serve the Apple App Site Association as JSON (Universal Links)
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default nextConfig;
