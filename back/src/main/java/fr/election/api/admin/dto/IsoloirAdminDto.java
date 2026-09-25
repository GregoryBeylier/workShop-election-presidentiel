package fr.election.api.admin.dto;

import java.time.LocalDateTime;

// État d'un isoloir pour le back office. borneEnLigne : la borne a appelé le serveur il y a moins de 10 s ;
// voteEnCours : un votant a scanné et n'a pas encore fini sur la borne (détail dans vote). Jamais de clé ici.
public record IsoloirAdminDto(Integer id, String libelle, boolean actif, boolean aUneBorne, boolean borneEnLigne,
		boolean voteEnCours, VoteEnCours vote) {

	// Qui vote et où il en est (duel en cours sur le total), jamais ses choix
	public record VoteEnCours(String votant, int duel, int total, LocalDateTime depuis) {
	}

}
