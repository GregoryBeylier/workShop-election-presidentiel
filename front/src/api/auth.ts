export interface LoginResponse {
  token: string;
  email: string;
  admin: boolean;
}

/**
 * Envoie les identifiants au back et stocke le JWT reçu.
 * Lève une erreur avec un message affichable si la connexion échoue.
 */
export async function login(
  email: string,
  motDePasse: string,
): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motDePasse }),
    });
  } catch {
    throw new Error("Impossible de joindre le serveur");
  }

  if (res.status === 401 || res.status === 400) {
    throw new Error("Email ou mot de passe incorrect");
  }
  if (!res.ok) {
    throw new Error("Erreur serveur, réessayez plus tard");
  }

  const data: LoginResponse = await res.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("email", data.email);
  localStorage.setItem("admin", String(data.admin));
  return data;
}

/** Supprime la session locale (déconnexion ou token invalide). */
export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  localStorage.removeItem("admin");
}

export type Role = "ADMIN" | "ELECTEUR";

interface JwtPayload {
  exp?: number;
  scope?: string;
}

/** Lit le contenu (non vérifié) d'un JWT, ou null s'il est illisible. */
function decodePayload(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as JwtPayload;
  } catch {
    // Token illisible (ex : ancien "fake-token-123")
    return null;
  }
}

/**
 * Renvoie le JWT stocké s'il est bien formé et pas expiré, sinon null
 * (et nettoie la session). La vraie vérification de la signature reste
 * faite par le back : ceci évite seulement d'afficher une page protégée
 * avec un token périmé ou bidon.
 */
export function getValidToken(): string | null {
  const token = localStorage.getItem("token");
  if (!token) return null;

  const exp = decodePayload(token)?.exp;
  if (typeof exp === "number" && exp * 1000 > Date.now()) {
    return token;
  }

  logout();
  return null;
}

/**
 * Rôle de l'utilisateur connecté, lu dans le token (claim "scope"),
 * ou null s'il n'est pas connecté. Sert uniquement à l'affichage :
 * les droits sont vérifiés par le back à chaque appel.
 */
export function getRole(): Role | null {
  const token = getValidToken();
  if (!token) return null;

  const scope = decodePayload(token)?.scope;
  return scope === "ADMIN" || scope === "ELECTEUR" ? scope : null;
}

/** Page d'arrivée après connexion selon le rôle : /admin pour un admin, / sinon. */
export function homePath(role: Role | null): string {
  return role === "ADMIN" ? "/admin" : "/";
}
