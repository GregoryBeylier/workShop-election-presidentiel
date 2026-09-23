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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "candidat")
public class Candidat {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_candidat")
	private Integer idCandidat;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_inscription", nullable = false, unique = true)
	private Inscription inscription;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_periode", nullable = false)
	private PeriodeVote periode;

	@Column(name = "nom", nullable = false, length = 100)
	private String nom = "";

	@Column(name = "prenom", nullable = false, length = 100)
	private String prenom = "";

	@Column(name = "parti", nullable = false, length = 100)
	private String parti = "";

	@Column(name = "inscrit_le", nullable = false)
	private LocalDate inscritLe = LocalDate.now();

	public Integer getIdCandidat() { return idCandidat; }
	public Inscription getInscription() { return inscription; }
	public void setInscription(Inscription inscription) { this.inscription = inscription; }
	public PeriodeVote getPeriode() { return periode; }
	public void setPeriode(PeriodeVote periode) { this.periode = periode; }
	public String getNom() { return nom; }
	public void setNom(String nom) { this.nom = nom; }
	public String getPrenom() { return prenom; }
	public void setPrenom(String prenom) { this.prenom = prenom; }
	public String getParti() { return parti; }
	public void setParti(String parti) { this.parti = parti; }
	public LocalDate getInscritLe() { return inscritLe; }

}
