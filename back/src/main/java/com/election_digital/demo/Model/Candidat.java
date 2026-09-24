package com.election_digital.demo.Model;

import com.election_digital.demo.Model.Inscription;
import com.election_digital.demo.Model.PeriodeVote;
import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "candidat")
public class Candidat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_candidat")
    private Long idCandidat;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_inscription", nullable = false, unique = true)
    private Inscription inscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_periode", nullable = false)
    private PeriodeVote periode;

    @Column(name = "nom", nullable = false)
    private String nom;

    @Column(name = "prenom", nullable = false)
    private String prenom;

    @Column(name = "inscrit_le", nullable = false)
    private LocalDate inscritLe;

    public Candidat() {
    }

    public Candidat(Long idCandidat, Inscription inscription, PeriodeVote periode, String nom, String prenom, LocalDate inscritLe) {
        this.idCandidat = idCandidat;
        this.inscription = inscription;
        this.periode = periode;
        this.nom = nom;
        this.prenom = prenom;
        this.inscritLe = inscritLe;
    }

    @PrePersist
    protected void onCreate() {
        if (inscritLe == null) {
            inscritLe = LocalDate.now();
        }
    }

    public Long getIdCandidat() {
        return idCandidat;
    }

    public void setIdCandidat(Long idCandidat) {
        this.idCandidat = idCandidat;
    }

    public Inscription getInscription() {
        return inscription;
    }

    public void setInscription(Inscription inscription) {
        this.inscription = inscription;
    }

    public PeriodeVote getPeriode() {
        return periode;
    }

    public void setPeriode(PeriodeVote periode) {
        this.periode = periode;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public void setPrenom(String prenom) {
        this.prenom = prenom;
    }

    public LocalDate getInscritLe() {
        return inscritLe;
    }

    public void setInscritLe(LocalDate inscritLe) {
        this.inscritLe = inscritLe;
    }
}