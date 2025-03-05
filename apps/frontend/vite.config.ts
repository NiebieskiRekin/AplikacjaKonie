import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        // changeOrigin: true,
        // secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@/frontend': '/src',
    },
  },
  build: {
    ssr: false,
  },
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    reactRouter(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,

      pwaAssets: {
        disabled: false,
        config: true,
      },

      manifest: {
        name: "aplikacja-konie-frontend",
        short_name: "aplikacja-konie-frontend",
        description: "Aplikacja dla hodowców koni i weterynarzy",
        theme_color: "#ffffff",
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },

      devOptions: {
        enabled: false,
        navigateFallback: "index.html",
        suppressWarnings: true,
        type: "module",
      },
    }),
  ],
});
