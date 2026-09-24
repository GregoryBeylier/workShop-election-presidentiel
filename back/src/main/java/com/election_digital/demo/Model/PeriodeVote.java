package com.election_digital.demo.Model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "periode_vote")
public class PeriodeVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_periode")
    private Long idPeriode;

    @Column(name = "statut", nullable = false)
    private Boolean statut;

    @Column(name = "ouvert_le", nullable = false)
    private LocalDate ouvertLe;

    @Column(name = "clos_le")
    private LocalDate closLe;

    public PeriodeVote() {
    }

    public PeriodeVote(Boolean statut, LocalDate ouvertLe, LocalDate closLe) {
        this.statut = statut;
        this.ouvertLe = ouvertLe;
        this.closLe = closLe;
    }

    public Long getIdPeriode() {
        return idPeriode;
    }

    public void setIdPeriode(Long idPeriode) {
        this.idPeriode = idPeriode;
    }

    public Boolean getStatut() {
        return statut;
    }

    public void setStatut(Boolean statut) {
        this.statut = statut;
    }

    public LocalDate getOuvertLe() {
        return ouvertLe;
    }

    public void setOuvertLe(LocalDate ouvertLe) {
        this.ouvertLe = ouvertLe;
    }

    public LocalDate getClosLe() {
        return closLe;
    }

    public void setClosLe(LocalDate closLe) {
        this.closLe = closLe;
    }
}