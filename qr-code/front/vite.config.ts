import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  // HTTPS obligatoire : les navigateurs mobiles refusent la caméra sur une page http://<ip>
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    // Accessible depuis les téléphones et tablettes du Wi-Fi de l'école
    host: true,
    // Même origine pour le front et l'API : pas de CORS ni de contenu mixte http/https
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
});
