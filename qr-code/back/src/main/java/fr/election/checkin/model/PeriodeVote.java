package fr.election.checkin.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "periode_vote")
public class PeriodeVote {

	@Id
	@Column(name = "id_periode")
	private Integer idPeriode;

	// true = période ouverte
	@Column(name = "statut", nullable = false)
	private boolean statut;

	public Integer getIdPeriode() { return idPeriode; }
	public boolean isStatut() { return statut; }

}
