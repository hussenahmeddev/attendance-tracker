import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["pwa-icon-192.png", "pwa-icon-512.png", "maskable-icon-512.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "firestore-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
      manifest: {
        name: "EduTrack - Attendance Tracker",
        short_name: "EduTrack",
        description: "High-performance attendance tracking for educators and admins.",
        start_url: "/",
        display: "standalone",
        background_color: "#06080F",
        theme_color: "#1B296B",
        orientation: "portrait-primary",
        categories: ["education", "productivity"],
        icons: [
          { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/maskable-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        screenshots: [
          { src: "/screenshot-1.png", sizes: "1024x1024", type: "image/png", form_factor: "narrow" as any, label: "Dashboard View" },
        ],
        shortcuts: [
          { name: "Mark Attendance", url: "/teacher/attendance", description: "Quickly mark attendance" },
          { name: "View Reports", url: "/admin/reports", description: "Access attendance statistics" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
