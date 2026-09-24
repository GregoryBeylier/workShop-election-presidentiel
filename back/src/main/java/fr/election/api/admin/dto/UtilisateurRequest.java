package fr.election.api.admin.dto;

// motDePasse : provisoire, l'utilisateur devra le changer à sa première connexion
public record UtilisateurRequest(String email, String motDePasse) {
}
