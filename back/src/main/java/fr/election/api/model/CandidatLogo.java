package fr.election.api.model;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

// Logo du candidat (parti, liste…), rangé dans les colonnes logo_* de la table candidat.
// Entité à part pour ne lire les octets que lorsqu'on sert le logo, pas à chaque chargement de candidat.
// Une ligne existe pour chaque candidat : pas de logo = colonnes vides (jamais de suppression de ligne)
@Entity
@Table(name = "candidat")
@AttributeOverride(name = "contenu", column = @Column(name = "logo_contenu"))
@AttributeOverride(name = "typeMime", column = @Column(name = "logo_type_mime", length = 50))
@AttributeOverride(name = "majLe", column = @Column(name = "logo_maj_le"))
public class CandidatLogo extends ImageCandidat {

	public boolean estVide() {
		return getContenu() == null;
	}

	public void vider() {
		setContenu(null);
		setTypeMime(null);
		setMajLe(null);
	}

}
