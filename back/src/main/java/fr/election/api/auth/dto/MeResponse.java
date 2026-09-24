package fr.election.api.auth.dto;

// Profil de l'utilisateur connecté (jamais le mot de passe)
public record MeResponse(String email, boolean admin) {
}
