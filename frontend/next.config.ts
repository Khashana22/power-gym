import type { NextConfig } from "next";
import { networkInterfaces } from "os";

/**
 * Collect all current LAN IPs from every network interface.
 * Next.js allowedDevOrigins accepts hostname strings (no protocol/port).
 * We add all private-range IPs found so mobile devices on any WiFi
 * can access the dev server without editing this file.
 */
function getLanOrigins(): string[] {
  const origins: string[] = [];
  const nets = networkInterfaces();
  for (const ifaces of Object.values(nets)) {
    for (const iface of ifaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        origins.push(iface.address);
      }
    }
  }
  return origins;
}

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment
  output: "standalone",
  // Allow LAN access from mobile devices on any network — dynamically
  // detected at server startup so no manual editing is ever required.
  allowedDevOrigins: getLanOrigins(),
  // Allow images from any domain for gym logos
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
