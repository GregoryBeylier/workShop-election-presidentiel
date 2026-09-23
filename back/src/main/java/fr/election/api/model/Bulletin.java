package fr.election.api.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

// Un seul bulletin par inscription : un électeur vote une fois par période
@Entity
@Table(name = "bulletin")
public class Bulletin {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_bulletin")
	private Integer idBulletin;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_inscription", nullable = false, unique = true)
	private Inscription inscription;

	@Column(name = "depose_le", nullable = false)
	private LocalDate deposeLe = LocalDate.now();

	public Integer getIdBulletin() { return idBulletin; }
	public Inscription getInscription() { return inscription; }
	public void setInscription(Inscription inscription) { this.inscription = inscription; }
	public LocalDate getDeposeLe() { return deposeLe; }

}
