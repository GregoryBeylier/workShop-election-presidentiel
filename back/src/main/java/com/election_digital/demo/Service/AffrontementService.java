package com.election_digital.demo.Service;

import com.election_digital.demo.Model.Affrontement;
import com.election_digital.demo.Model.Candidat;
import com.election_digital.demo.Repository.AffrontementRepository;
import com.election_digital.demo.Model.PeriodeVote;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class AffrontementService {

    private final AffrontementRepository affrontementRepository;

    public AffrontementService(AffrontementRepository affrontementRepository) {
        this.affrontementRepository = affrontementRepository;
    }

    public List<Affrontement> findAll() {
        return affrontementRepository.findAll();
    }

    public Optional<Affrontement> findById(Long id) {
        return affrontementRepository.findById(id);
    }

    public List<Affrontement> findByCandidat(Candidat candidat) {
        return affrontementRepository.findByCandidat1OrCandidat2(candidat, candidat);
    }

    public List<Affrontement> findByChoix(Integer choix) {
        return affrontementRepository.findByChoix(choix);
    }

    public List<Affrontement> findByPeriodeOrdonnes(PeriodeVote periode) {
        return affrontementRepository.findByCandidat1_PeriodeOrderByChoixAsc(periode);
    }

    public Affrontement create(Candidat candidat1, Candidat candidat2, Integer choix) {
        if (candidat1.getIdCandidat().equals(candidat2.getIdCandidat())) {
            throw new IllegalArgumentException("Un candidat ne peut pas s'affronter lui-même.");
        }
        Affrontement affrontement = new Affrontement(null, candidat1, candidat2, choix, LocalDate.now());
        return affrontementRepository.save(affrontement);
    }

    public void delete(Long id) {
        if (!affrontementRepository.existsById(id)) {
            throw new IllegalArgumentException("Affrontement introuvable avec l'id : " + id);
        }
        affrontementRepository.deleteById(id);
    }
}