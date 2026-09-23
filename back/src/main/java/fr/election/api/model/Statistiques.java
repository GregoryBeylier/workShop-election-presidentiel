package fr.election.api.model;

import java.math.BigDecimal;

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

@Entity
@Table(name = "statistiques", uniqueConstraints = @UniqueConstraint(name = "uq_stat", columnNames = { "id_periode", "id_candidat" }))
public class Statistiques {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_statistiques")
	private Integer idStatistiques;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_periode", nullable = false)
	private PeriodeVote periode;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "id_candidat", nullable = false)
	private Candidat candidat;

	@Column(name = "total_points", nullable = false, precision = 5, scale = 2)
	private BigDecimal totalPoints = BigDecimal.ZERO;

	@Column(name = "nb_victoires", nullable = false)
	private int nbVictoires = 0;

	@Column(name = "nb_egalites", nullable = false)
	private int nbEgalites = 0;

	public Integer getIdStatistiques() { return idStatistiques; }
	public PeriodeVote getPeriode() { return periode; }
	public void setPeriode(PeriodeVote periode) { this.periode = periode; }
	public Candidat getCandidat() { return candidat; }
	public void setCandidat(Candidat candidat) { this.candidat = candidat; }
	public BigDecimal getTotalPoints() { return totalPoints; }
	public void setTotalPoints(BigDecimal totalPoints) { this.totalPoints = totalPoints; }
	public int getNbVictoires() { return nbVictoires; }
	public void setNbVictoires(int nbVictoires) { this.nbVictoires = nbVictoires; }
	public int getNbEgalites() { return nbEgalites; }
	public void setNbEgalites(int nbEgalites) { this.nbEgalites = nbEgalites; }

}
