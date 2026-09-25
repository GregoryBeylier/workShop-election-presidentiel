package com.election_digital.demo.Service;

import com.election_digital.demo.Model.Borne;
import com.election_digital.demo.Repository.BorneRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BorneService {

    private final BorneRepository borneRepository;

    public BorneService(BorneRepository borneRepository) {
        this.borneRepository = borneRepository;
    }

    public List<Borne> findAll() {
        return borneRepository.findAll();
    }

    public Optional<Borne> findById(Long id) {
        return borneRepository.findById(id);
    }

    public Optional<Borne> findByCle(String cleBorne) {
        return borneRepository.findByCleBorne(cleBorne);
    }

    public Borne create() {
        Borne borne = new Borne();
        borne.setEtat(Borne.EtatBorne.LIBRE);
        borne.setEnLigne(false);
        return borneRepository.save(borne);
    }

    public String genererCle(Long idBorne) {
        Borne borne = borneRepository.findById(idBorne)
                .orElseThrow(() -> new IllegalArgumentException("Borne introuvable avec l'id : " + idBorne));

        String nouvelleCle = UUID.randomUUID().toString();
        borne.setCleBorne(nouvelleCle);
        borneRepository.save(borne);

        return nouvelleCle;
    }

    public Borne deverrouiller(Long idBorne) {
        Borne borne = borneRepository.findById(idBorne)
                .orElseThrow(() -> new IllegalArgumentException("Borne introuvable avec l'id : " + idBorne));

        if (borne.getEtat() == Borne.EtatBorne.DEVERROUILLEE) {
            throw new IllegalStateException("La borne est déjà déverrouillée.");
        }

        borne.setEtat(Borne.EtatBorne.DEVERROUILLEE);
        return borneRepository.save(borne);
    }

    public Borne liberer(Long idBorne) {
        Borne borne = borneRepository.findById(idBorne)
                .orElseThrow(() -> new IllegalArgumentException("Borne introuvable avec l'id : " + idBorne));

        borne.setEtat(Borne.EtatBorne.LIBRE);
        return borneRepository.save(borne);
    }

    public Borne marquerEnLigne(Long idBorne, boolean enLigne) {
        Borne borne = borneRepository.findById(idBorne)
                .orElseThrow(() -> new IllegalArgumentException("Borne introuvable avec l'id : " + idBorne));

        borne.setEnLigne(enLigne);
        return borneRepository.save(borne);
    }
}