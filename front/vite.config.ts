import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // En dev, les appels /api/... sont redirigés vers le back Spring Boot
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
