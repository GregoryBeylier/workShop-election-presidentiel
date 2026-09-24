package com.election_digital.demo.Model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "bulletin")
public class Bulletin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_bulletin")
    private Long idBulletin;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_inscription", nullable = false, unique = true)
    private Inscription inscription;

    @Column(name = "depose_le", nullable = false)
    private LocalDate deposeLe;

    public Bulletin() {
    }

    public Bulletin(Long idBulletin, Inscription inscription, LocalDate deposeLe) {
        this.idBulletin = idBulletin;
        this.inscription = inscription;
        this.deposeLe = deposeLe;
    }

    @PrePersist
    protected void onCreate() {
        if (deposeLe == null) {
            deposeLe = LocalDate.now();
        }
    }

    public Long getIdBulletin() {
        return idBulletin;
    }

    public void setIdBulletin(Long idBulletin) {
        this.idBulletin = idBulletin;
    }

    public Inscription getInscription() {
        return inscription;
    }

    public void setInscription(Inscription inscription) {
        this.inscription = inscription;
    }

    public LocalDate getDeposeLe() {
        return deposeLe;
    }

    public void setDeposeLe(LocalDate deposeLe) {
        this.deposeLe = deposeLe;
    }
}