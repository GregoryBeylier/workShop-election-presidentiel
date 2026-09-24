package fr.election.api.auth.dto;

// Renvoyé au front après une connexion réussie (jamais le mot de passe).
// motDePasseProvisoire : le front doit d'abord faire choisir un nouveau mot de passe
public record LoginResponse(String token, String email, boolean admin, boolean motDePasseProvisoire) {
}
