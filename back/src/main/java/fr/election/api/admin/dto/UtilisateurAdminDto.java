package fr.election.api.admin.dto;

import java.time.LocalDate;

// statutVote : AUCUN, EN_COURS, TERMINE (scrutin en cours) ;
// statutCompte : PROVISOIRE (mot de passe de l'admin pas encore changé) ou ACTIF
public record UtilisateurAdminDto(Integer id, String email, boolean admin, boolean inscrit,
		boolean candidat, String statutVote, String statutCompte, LocalDate creeLe) {
}
