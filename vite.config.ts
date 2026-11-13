import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  base: mode === "github" ? "/nexora/" : "/",
  plugins: [react()],
  build: { chunkSizeWarningLimit: 650 },
}));
