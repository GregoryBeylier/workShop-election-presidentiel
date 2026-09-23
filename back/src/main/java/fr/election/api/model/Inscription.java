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
import jakarta.persistence.UniqueConstraint;

// Inscription d'un utilisateur à une période de vote (une seule par période)
@Entity
@Table(name = "inscription", uniqueConstraints = @UniqueConstraint(name = "uq_inscription", columnNames = { "id_utilisateur", "id_periode" }))
public class Inscription {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_inscription")
	private Integer idInscription;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_utilisateur", nullable = false)
	private Utilisateur utilisateur;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_periode", nullable = false)
	private PeriodeVote periode;

	@Column(name = "inscrit_le", nullable = false)
	private LocalDate inscritLe = LocalDate.now();

	public Integer getIdInscription() { return idInscription; }
	public Utilisateur getUtilisateur() { return utilisateur; }
	public void setUtilisateur(Utilisateur utilisateur) { this.utilisateur = utilisateur; }
	public PeriodeVote getPeriode() { return periode; }
	public void setPeriode(PeriodeVote periode) { this.periode = periode; }
	public LocalDate getInscritLe() { return inscritLe; }

}
