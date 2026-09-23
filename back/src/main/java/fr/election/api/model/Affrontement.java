package fr.election.api.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// Duel entre deux candidats différents (une seule fois par paire)
@Entity
@Table(name = "affrontement")
public class Affrontement {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_affrontement")
	private Integer idAffrontement;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_candidat_1", nullable = false)
	private Candidat candidat1;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_candidat_2", nullable = false)
	private Candidat candidat2;

	@Column(name = "cree_le", nullable = false)
	private LocalDate creeLe = LocalDate.now();

	public Integer getIdAffrontement() { return idAffrontement; }
	public Candidat getCandidat1() { return candidat1; }
	public void setCandidat1(Candidat candidat1) { this.candidat1 = candidat1; }
	public Candidat getCandidat2() { return candidat2; }
	public void setCandidat2(Candidat candidat2) { this.candidat2 = candidat2; }
	public LocalDate getCreeLe() { return creeLe; }

}
