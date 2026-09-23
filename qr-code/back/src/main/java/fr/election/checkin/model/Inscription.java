package fr.election.checkin.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

// Inscription d'un utilisateur à une période de vote : c'est elle qui porte le droit de vote
@Entity
@Table(name = "inscription")
public class Inscription {

	@Id
	@Column(name = "id_inscription")
	private Integer idInscription;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_utilisateur", nullable = false)
	private Utilisateur utilisateur;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_periode", nullable = false)
	private PeriodeVote periode;

	public Integer getIdInscription() { return idInscription; }
	public Utilisateur getUtilisateur() { return utilisateur; }
	public PeriodeVote getPeriode() { return periode; }

}
