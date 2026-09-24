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
        "/api": {
          target: "http://localhost:8080",
          // En https, l'origine (https://localhost:5173 ou https://<ip>:5173) n'est pas dans la liste
          // CORS du back, qui renverrait 403. Pour le navigateur, front et API sont à la même adresse
          // (le proxy) : on retire donc l'en-tête Origin. Sans risque CSRF, l'appli utilise un JWT en header.
          configure: (proxy) => {
            if (https) proxy.on("proxyReq", (proxyReq) => proxyReq.removeHeader("origin"));
          },
        },
      },
    },
  };
});
