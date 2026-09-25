package com.election_digital.demo.Service;

import com.election_digital.demo.Model.Inscription;
import com.election_digital.demo.Model.PeriodeVote;
import com.election_digital.demo.Model.Utilisateur;
import com.election_digital.demo.Repository.InscriptionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class InscriptionService {

    private final InscriptionRepository inscriptionRepository;

    public InscriptionService(InscriptionRepository inscriptionRepository) {
        this.inscriptionRepository = inscriptionRepository;
    }

    public List<Inscription> findAll() {
        return inscriptionRepository.findAll();
    }

    public Optional<Inscription> findById(Long id) {
        return inscriptionRepository.findById(id);
    }

    public List<Inscription> findByUtilisateur(Utilisateur utilisateur) {
        return inscriptionRepository.findByUtilisateur(utilisateur);
    }

    public List<Inscription> findByPeriode(PeriodeVote periode) {
        return inscriptionRepository.findByPeriode(periode);
    }

    public Inscription create(Utilisateur utilisateur, PeriodeVote periode) {
        if (inscriptionRepository.existsByUtilisateurAndPeriode(utilisateur, periode)) {
            throw new IllegalArgumentException("Cet utilisateur est déjà inscrit à cette période.");
        }
        Inscription inscription = new Inscription(null, utilisateur, periode, LocalDate.now());
        return inscriptionRepository.save(inscription);
    }

    public void delete(Long id) {
        if (!inscriptionRepository.existsById(id)) {
            throw new IllegalArgumentException("Inscription introuvable avec l'id : " + id);
        }
        inscriptionRepository.deleteById(id);
    }
}