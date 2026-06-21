import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.skishare.app",
  appName: "SkiShare",
  // webDir is required by Capacitor but unused at runtime — the app loads the
  // live site (API routes, DB and server components all run on Vercel).
  webDir: "public",
  server: {
    url: "https://skisharebook.com",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0b1220",
  },
};

export default config;
