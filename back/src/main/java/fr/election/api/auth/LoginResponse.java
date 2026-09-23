package fr.election.api.auth;

// Renvoyé au front après une connexion réussie (jamais le mot de passe)
public record LoginResponse(String token, String email, boolean admin) {
}
