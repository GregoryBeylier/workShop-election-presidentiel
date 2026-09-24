package com.election_digital.demo.Model;

import jakarta.persistence.*;

@Entity
@Table(
        name = "ligne_vote",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_bulletin", "id_affrontement"})
)
public class LigneVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ligne")
    private Long idLigne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_bulletin", nullable = false)
    private Bulletin bulletin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_affrontement", nullable = false)
    private Affrontement affrontement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_candidat_choisi", nullable = false)
    private Candidat candidatChoisi;

    public LigneVote() {
    }

    public LigneVote(Long idLigne, Bulletin bulletin, Affrontement affrontement, Candidat candidatChoisi) {
        this.idLigne = idLigne;
        this.bulletin = bulletin;
        this.affrontement = affrontement;
        this.candidatChoisi = candidatChoisi;
    }

    public Long getIdLigne() {
        return idLigne;
    }

    public void setIdLigne(Long idLigne) {
        this.idLigne = idLigne;
    }

    public Bulletin getBulletin() {
        return bulletin;
    }

    public void setBulletin(Bulletin bulletin) {
        this.bulletin = bulletin;
    }

    public Affrontement getAffrontement() {
        return affrontement;
    }

    public void setAffrontement(Affrontement affrontement) {
        this.affrontement = affrontement;
    }

    public Candidat getCandidatChoisi() {
        return candidatChoisi;
    }

    public void setCandidatChoisi(Candidat candidatChoisi) {
        this.candidatChoisi = candidatChoisi;
    }
}