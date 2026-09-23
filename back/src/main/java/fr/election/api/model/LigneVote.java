package fr.election.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

// Choix d'un bulletin pour un affrontement ; candidatChoisi null = égalité
@Entity
@Table(name = "ligne_vote", uniqueConstraints = @UniqueConstraint(name = "uq_ligne", columnNames = { "id_bulletin", "id_affrontement" }))
public class LigneVote {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_ligne")
	private Integer idLigne;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_bulletin", nullable = false)
	private Bulletin bulletin;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_affrontement", nullable = false)
	private Affrontement affrontement;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "id_candidat_choisi")
	private Candidat candidatChoisi;

	public Integer getIdLigne() { return idLigne; }
	public Bulletin getBulletin() { return bulletin; }
	public void setBulletin(Bulletin bulletin) { this.bulletin = bulletin; }
	public Affrontement getAffrontement() { return affrontement; }
	public void setAffrontement(Affrontement affrontement) { this.affrontement = affrontement; }
	public Candidat getCandidatChoisi() { return candidatChoisi; }
	public void setCandidatChoisi(Candidat candidatChoisi) { this.candidatChoisi = candidatChoisi; }

}
