package com.election_digital.demo.Service;

import com.election_digital.demo.Model.Candidat;
import com.election_digital.demo.Model.Inscription;
import com.election_digital.demo.Model.PeriodeVote;
import com.election_digital.demo.Repository.CandidatRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class CandidatService {

    private final CandidatRepository candidatRepository;

    public CandidatService(CandidatRepository candidatRepository) {
        this.candidatRepository = candidatRepository;
    }

    public List<Candidat> findAll() {
        return candidatRepository.findAll();
    }

    public Optional<Candidat> findById(Long id) {
        return candidatRepository.findById(id);
    }

    public List<Candidat> findByPeriode(PeriodeVote periode) {
        return candidatRepository.findByPeriode(periode);
    }

    public Optional<Candidat> findByInscription(Inscription inscription) {
        return candidatRepository.findByInscription(inscription);
    }

    public Candidat create(Inscription inscription, PeriodeVote periode, String nom, String prenom) {
        if (candidatRepository.existsByInscription(inscription)) {
            throw new IllegalArgumentException("Cette inscription est déjà associée à une candidature.");
        }
        Candidat candidat = new Candidat(null, inscription, periode, nom, prenom, LocalDate.now());
        return candidatRepository.save(candidat);
    }

    public Candidat update(Long id, String nom, String prenom) {
        Candidat candidat = candidatRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Candidat introuvable avec l'id : " + id));

        candidat.setNom(nom);
        candidat.setPrenom(prenom);

        return candidatRepository.save(candidat);
    }

    public void delete(Long id) {
        if (!candidatRepository.existsById(id)) {
            throw new IllegalArgumentException("Candidat introuvable avec l'id : " + id);
        }
        candidatRepository.deleteById(id);
    }
}