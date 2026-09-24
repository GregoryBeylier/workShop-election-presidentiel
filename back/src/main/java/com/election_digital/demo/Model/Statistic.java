package com.election_digital.demo.Model;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(
        name = "statistiques",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_periode", "id_candidat"})
)
public class Statistic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_statistiques")
    private Long idStatistiques;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_periode", nullable = false)
    private PeriodeVote periode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_candidat", nullable = false)
    private Candidat candidat;

    @Column(name = "total_points", nullable = false, precision = 5, scale = 2)
    private BigDecimal totalPoints;

    @Column(name = "nb_victoires", nullable = false)
    private Integer nbVictoires;

    @Column(name = "nb_egalites", nullable = false)
    private Integer nbEgalites;

    public Statistic() {
    }

    public Statistic(Long idStatistiques, PeriodeVote periode, Candidat candidat, BigDecimal totalPoints, Integer nbVictoires, Integer nbEgalites) {
        this.idStatistiques = idStatistiques;
        this.periode = periode;
        this.candidat = candidat;
        this.totalPoints = totalPoints;
        this.nbVictoires = nbVictoires;
        this.nbEgalites = nbEgalites;
    }

    public Long getIdStatistiques() {
        return idStatistiques;
    }

    public void setIdStatistiques(Long idStatistiques) {
        this.idStatistiques = idStatistiques;
    }

    public PeriodeVote getPeriode() {
        return periode;
    }

    public void setPeriode(PeriodeVote periode) {
        this.periode = periode;
    }

    public Candidat getCandidat() {
        return candidat;
    }

    public void setCandidat(Candidat candidat) {
        this.candidat = candidat;
    }

    public BigDecimal getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(BigDecimal totalPoints) {
        this.totalPoints = totalPoints;
    }

    public Integer getNbVictoires() {
        return nbVictoires;
    }

    public void setNbVictoires(Integer nbVictoires) {
        this.nbVictoires = nbVictoires;
    }

    public Integer getNbEgalites() {
        return nbEgalites;
    }

    public void setNbEgalites(Integer nbEgalites) {
        this.nbEgalites = nbEgalites;
    }
}
