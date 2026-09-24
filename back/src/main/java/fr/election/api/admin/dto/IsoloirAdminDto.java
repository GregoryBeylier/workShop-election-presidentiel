package fr.election.api.admin.dto;

// État d'un isoloir pour le back office. borneEnLigne : la borne a appelé le serveur il y a moins de 10 s ;
// voteEnCours : un votant a scanné et n'a pas encore fini sur la borne. Jamais de clé ici.
public record IsoloirAdminDto(Integer id, String libelle, boolean actif, boolean aUneBorne, boolean borneEnLigne,
		boolean voteEnCours) {
}
