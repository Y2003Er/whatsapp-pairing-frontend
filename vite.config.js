import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Mirrors the vercel.json "/api/*" rewrite so `npm run dev` keeps
    // working now that src/config.js calls a relative "/api" path instead
    // of the Railway URL directly. Without this, every fetch in dev would
    // hit http://localhost:5173/api/... and 404.
    proxy: {
      "/api": {
        target: "https://pairing-fronted.up.railway.app",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
