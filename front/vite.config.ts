import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // `npm run dev:https` : HTTPS + accessible depuis le Wi-Fi, nécessaire pour tester le scan
  // du QR isoloir sur téléphone (les navigateurs mobiles refusent la caméra en http://<ip>)
  const https = mode === "https";

  return {
    plugins: [react(), tailwindcss(), ...(https ? [basicSsl()] : [])],
    server: {
      host: https,
      // En dev, les appels /api/... sont redirigés vers le back Spring Boot
      proxy: {
        "/api": "http://localhost:8080",
      },
    },
  };
});
