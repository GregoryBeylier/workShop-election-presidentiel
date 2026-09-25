package fr.election.api.admin.dto;

// État d'un isoloir pour le back office. ipBorne : IP de sa borne (null = pas de borne) ; borneEnLigne : la borne a appelé le serveur il y a moins de 10 s ;
// voteEnCours : un votant a validé le code et n'a pas encore fini sur la borne. Jamais de clé ici.
public record IsoloirAdminDto(Integer id, String libelle, boolean actif, String ipBorne, boolean borneEnLigne,
		boolean voteEnCours) {
}
