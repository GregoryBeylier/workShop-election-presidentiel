package com.election_digital.demo.Model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "inscription",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_utilisateur", "id_periode"})
)
public class Inscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_inscription")
    private Long idInscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_utilisateur", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_periode", nullable = false)
    private PeriodeVote periode;

    @Column(name = "inscrit_le", nullable = false)
    private LocalDate inscritLe;

    public Inscription() {
    }

    public Inscription(Long idInscription, Utilisateur utilisateur, PeriodeVote periode, LocalDate inscritLe) {
        this.idInscription = idInscription;
        this.utilisateur = utilisateur;
        this.periode = periode;
        this.inscritLe = inscritLe;
    }

    @PrePersist
    protected void onCreate() {
        if (inscritLe == null) {
            inscritLe = LocalDate.now();
        }
    }

    public Long getIdInscription() {
        return idInscription;
    }

    public void setIdInscription(Long idInscription) {
        this.idInscription = idInscription;
    }

    public Utilisateur getUtilisateur() {
        return utilisateur;
    }

    public void setUtilisateur(Utilisateur utilisateur) {
        this.utilisateur = utilisateur;
    }

    public PeriodeVote getPeriode() {
        return periode;
    }

    public void setPeriode(PeriodeVote periode) {
        this.periode = periode;
    }

    public LocalDate getInscritLe() {
        return inscritLe;
    }

    public void setInscritLe(LocalDate inscritLe) {
        this.inscritLe = inscritLe;
    }
}