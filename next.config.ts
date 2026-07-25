import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,

  /**
   * Server Actions default to a 1MB body limit — every file upload in this
   * app (KYC document, annonce images, shop logo, CSV import) goes through
   * a Server Action (`serverUpload` in ApiServer.ts), so a real photo from
   * a phone camera crashes with an uncaught "Body exceeded 1 MB limit"
   * (statusCode 413) that escapes every try/catch — the user sees Next's
   * generic "An error occurred in the Server Components render" instead of
   * a real error message. Confirmed via real testing (cf. HANDOFF_INFRA.md,
   * 2026-07-26).
   */
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
