import { API_URL } from "./config";
import { getValidToken, logout } from "./auth";

/** Erreur d'appel API, avec le code HTTP pour que l'appelant puisse réagir (409, 404...). */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * fetch vers le back avec le JWT en en-tête et le corps JSON
 * (ou multipart si `body` est un FormData : envoi de fichier).
 * Un 401 (token refusé) vide la session et renvoie sur /login.
 */
export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = getValidToken();
  const multipart = options.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // En multipart, le navigateur fixe lui-même le Content-Type (avec la frontière)
        ...(options.body !== undefined && !multipart
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body: multipart
        ? (options.body as FormData)
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
    });
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur");
  }

  if (res.status === 401) {
    logout();
    window.location.assign("/login");
    throw new ApiError(401, "Session expirée");
  }
  if (!res.ok) {
    // Spring renvoie { message } quand server.error.include-message est actif, sinon on garde un message générique
    const data = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      data?.message || "Erreur serveur, réessayez plus tard",
    );
  }

  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}
