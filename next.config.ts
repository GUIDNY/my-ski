import type { NextConfig } from "next";

// Bots that get the page title, description and canonical inside <head>.
// Next streams metadata into <body> for everyone else, which Googlebot reads
// only after rendering and AI crawlers (they don't run JavaScript) may miss.
// Setting this replaces Next's default list, so the default (copied from
// next/dist/shared/lib/router/utils/html-bots.js, 16.2.6) comes first.
const NEXT_DEFAULT_HTML_LIMITED =
  String.raw`[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight`;
const SEARCH_AND_AI_BOTS =
  String.raw`Googlebot|GPTBot|OAI-SearchBot|ChatGPT-User|PerplexityBot|Perplexity-User|ClaudeBot|Claude-SearchBot|Claude-User|CCBot|Amazonbot|meta-externalagent|meta-externalfetcher|Bytespider|DuckAssistBot|MistralAI-User|cohere-ai|YouBot|Diffbot|TelegramBot`;

const nextConfig: NextConfig = {
  htmlLimitedBots: new RegExp(`${NEXT_DEFAULT_HTML_LIMITED}|${SEARCH_AND_AI_BOTS}`, "i"),
  // @sparticuz/chromium's compressed binaries (bin/*.br) are loaded from a
  // computed path at runtime, so Next's static file tracer misses them —
  // without this, the PDF route's Chromium executablePath() 404s in prod.
  outputFileTracingIncludes: {
    "/api/proposals/\\[id\\]/pdf": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    "/api/flight-return": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
  async headers() {
    return [
      {
        // serve the Apple App Site Association as JSON (Universal Links)
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        // data endpoints are not pages: keep them out of search results
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      // the English and French pages share the Hebrew root layout (<html lang="he">,
      // fixed in the browser): say their language in the response too (Bing reads it)
      { source: "/en", headers: [{ key: "Content-Language", value: "en" }] },
      { source: "/en/:path*", headers: [{ key: "Content-Language", value: "en" }] },
      { source: "/fr", headers: [{ key: "Content-Language", value: "fr" }] },
      { source: "/fr/:path*", headers: [{ key: "Content-Language", value: "fr" }] },
    ];
  },
};

export default nextConfig;
