package com.election_digital.demo.Model;

import jakarta.persistence.*;

@Entity
@Table(name = "borne")
public class Borne {

    public enum EtatBorne {
        LIBRE,
        DEVERROUILLEE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_borne")
    private Long idBorne;

    @Column(name = "cle_borne", nullable = false, unique = true)
    private String cleBorne;

    @Enumerated(EnumType.STRING)
    @Column(name = "etat", nullable = false)
    private EtatBorne etat = EtatBorne.LIBRE;

    @Column(name = "en_ligne", nullable = false)
    private boolean enLigne = false;

    public Borne() {
    }

    public Long getIdBorne() {
        return idBorne;
    }

    public void setIdBorne(Long idBorne) {
        this.idBorne = idBorne;
    }

    public String getCleBorne() {
        return cleBorne;
    }

    public void setCleBorne(String cleBorne) {
        this.cleBorne = cleBorne;
    }

    public EtatBorne getEtat() {
        return etat;
    }

    public void setEtat(EtatBorne etat) {
        this.etat = etat;
    }

    public boolean isEnLigne() {
        return enLigne;
    }

    public void setEnLigne(boolean enLigne) {
        this.enLigne = enLigne;
    }
}
