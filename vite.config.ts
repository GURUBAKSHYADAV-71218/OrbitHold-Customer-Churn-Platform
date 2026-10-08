import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Frontend source lives in /frontend; the app is built from there but
// vite.config.ts stays at the repo root so Vercel's zero-config Vite
// detection (and `vercel dev`) picks it up automatically.
export default defineConfig({
  root: "frontend",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend/src"),
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});

// No dev-server proxy is configured here on purpose: the frontend only
// ever calls relative paths like fetch("/api/predict"), and the single
// recommended local workflow is `vercel dev`, which serves the built
// frontend and the /api functions together on one origin — so there is
// no separate port to proxy to. See README "Local development".
