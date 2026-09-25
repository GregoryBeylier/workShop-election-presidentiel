/**
 * Base des URL de l'API, lue au build dans VITE_API_URL (ex. https://api.mon-domaine.fr/api).
 * Par défaut "/api" : même origine que le front, relayée par le proxy Vite en dev et par nginx en Docker.
 */
export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");
