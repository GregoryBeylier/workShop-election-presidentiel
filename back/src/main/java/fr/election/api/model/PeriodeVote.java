package fr.election.api.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "periode_vote")
public class PeriodeVote {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_periode")
	private Integer idPeriode;

	// true = période ouverte
	@Column(name = "statut", nullable = false)
	private boolean statut = false;

	@Column(name = "ouvert_le")
	private LocalDate ouvertLe;

	@Column(name = "clos_le")
	private LocalDate closLe;

	public Integer getIdPeriode() { return idPeriode; }
	public boolean isStatut() { return statut; }
	public void setStatut(boolean statut) { this.statut = statut; }
	public LocalDate getOuvertLe() { return ouvertLe; }
	public void setOuvertLe(LocalDate ouvertLe) { this.ouvertLe = ouvertLe; }
	public LocalDate getClosLe() { return closLe; }
	public void setClosLe(LocalDate closLe) { this.closLe = closLe; }

}
