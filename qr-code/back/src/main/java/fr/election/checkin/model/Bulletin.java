package fr.election.checkin.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

// Bulletin déposé dans l'appli : son existence signifie "a voté via l'appli"
@Entity
@Table(name = "bulletin")
public class Bulletin {

	@Id
	@Column(name = "id_bulletin")
	private Integer idBulletin;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_inscription", nullable = false, unique = true)
	private Inscription inscription;

	public Integer getIdBulletin() { return idBulletin; }
	public Inscription getInscription() { return inscription; }

}
