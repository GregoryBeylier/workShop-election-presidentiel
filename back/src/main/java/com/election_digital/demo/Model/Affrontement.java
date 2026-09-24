package com.election_digital.demo.Model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "affrontement")
public class Affrontement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_affrontement")
    private Long idAffrontement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_candidat_1", nullable = false)
    private Candidat candidat1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_candidat_2", nullable = false)
    private Candidat candidat2;

    @Column(name = "choix", nullable = false)
    private Integer choix;

    @Column(name = "cree_le", nullable = false)
    private LocalDate creeLe;

    public Affrontement() {
    }

    public Affrontement(Long idAffrontement, Candidat candidat1, Candidat candidat2, Integer choix, LocalDate creeLe) {
        this.idAffrontement = idAffrontement;
        this.candidat1 = candidat1;
        this.candidat2 = candidat2;
        this.choix = choix;
        this.creeLe = creeLe;
    }

    @PrePersist
    protected void onCreate() {
        if (creeLe == null) {
            creeLe = LocalDate.now();
        }
    }

    public Long getIdAffrontement() {
        return idAffrontement;
    }

    public void setIdAffrontement(Long idAffrontement) {
        this.idAffrontement = idAffrontement;
    }

    public Candidat getCandidat1() {
        return candidat1;
    }

    public void setCandidat1(Candidat candidat1) {
        this.candidat1 = candidat1;
    }

    public Candidat getCandidat2() {
        return candidat2;
    }

    public void setCandidat2(Candidat candidat2) {
        this.candidat2 = candidat2;
    }

    public Integer getChoix() {
        return choix;
    }

    public void setChoix(Integer choix) {
        this.choix = choix;
    }

    public LocalDate getCreeLe() {
        return creeLe;
    }

    public void setCreeLe(LocalDate creeLe) {
        this.creeLe = creeLe;
    }
}