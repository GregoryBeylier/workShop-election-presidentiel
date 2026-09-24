package fr.election.api.model;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

// Choix fait sur la borne pour un duel, en attendant le dernier duel : il devient alors une ligne_vote.
// N'entre JAMAIS dans les résultats. Un seul choix par (vote, duel) : un choix renvoyé deux fois n'est pas doublé.
@Entity
@Table(name = "choix_provisoire")
@IdClass(ChoixProvisoire.Cle.class)
public class ChoixProvisoire {

	public static final String GAUCHE = "GAUCHE";
	public static final String DROITE = "DROITE";
	public static final String BLANC = "BLANC";

	// Le vote ouvert sur la borne = l'émargement du votant (le "jeton" envoyé à la borne)
	@Id
	@Column(name = "id_emargement")
	private Integer idEmargement;

	@Id
	@Column(name = "id_affrontement")
	private Integer idAffrontement;

	@Column(name = "choix", nullable = false, length = 10)
	private String choix;

	protected ChoixProvisoire() {
	}

	public ChoixProvisoire(Integer idEmargement, Integer idAffrontement, String choix) {
		this.idEmargement = idEmargement;
		this.idAffrontement = idAffrontement;
		this.choix = choix;
	}

	public Integer getIdEmargement() { return idEmargement; }
	public Integer getIdAffrontement() { return idAffrontement; }
	public String getChoix() { return choix; }

	public static class Cle implements Serializable {

		private Integer idEmargement;
		private Integer idAffrontement;

		public Cle() {
		}

		public Cle(Integer idEmargement, Integer idAffrontement) {
			this.idEmargement = idEmargement;
			this.idAffrontement = idAffrontement;
		}

		@Override
		public boolean equals(Object o) {
			return o instanceof Cle c && Objects.equals(idEmargement, c.idEmargement)
					&& Objects.equals(idAffrontement, c.idAffrontement);
		}

		@Override
		public int hashCode() {
			return Objects.hash(idEmargement, idAffrontement);
		}

	}

}
