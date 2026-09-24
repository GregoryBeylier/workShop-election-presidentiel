package fr.election.api.admin.dto;

// mode : SUPPRIME (aucune trace de vote) ou ANONYMISE (votes conservés sans lien avec la personne)
public record SuppressionDto(String mode) {
}
