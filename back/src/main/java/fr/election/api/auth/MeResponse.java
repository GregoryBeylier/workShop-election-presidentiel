package fr.election.api.auth;

// Profil de l'utilisateur connecté (jamais le mot de passe)
public record MeResponse(String email, String matricule, boolean admin) {
}
