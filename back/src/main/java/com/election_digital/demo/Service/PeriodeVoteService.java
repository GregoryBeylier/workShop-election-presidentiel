package com.election_digital.demo.Service;

import com.election_digital.demo.Model.PeriodeVote;
import com.election_digital.demo.Repository.PeriodeVoteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class PeriodeVoteService {

    private final PeriodeVoteRepository periodeVoteRepository;

    public PeriodeVoteService(PeriodeVoteRepository periodeVoteRepository) {
        this.periodeVoteRepository = periodeVoteRepository;
    }

    public List<PeriodeVote> findAll() {
        return periodeVoteRepository.findAll();
    }

    public Optional<PeriodeVote> findById(Long id) {
        return periodeVoteRepository.findById(id);
    }

    public List<PeriodeVote> findActives() {
        return periodeVoteRepository.findByStatutTrue();
    }

    public Optional<PeriodeVote> findPeriodeEnCours() {
        LocalDate today = LocalDate.now();
        return periodeVoteRepository.findByOuvertLeLessThanEqualAndClosLeGreaterThanEqual(today, today);
    }

    public List<PeriodeVote> findSansCloture() {
        return periodeVoteRepository.findByClosLeIsNull();
    }

    public PeriodeVote create(PeriodeVote periodeVote) {
        if (periodeVote.getOuvertLe() == null) {
            periodeVote.setOuvertLe(LocalDate.now());
        }
        return periodeVoteRepository.save(periodeVote);
    }

    public PeriodeVote cloturer(Long id) {
        PeriodeVote periodeVote = periodeVoteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Période introuvable avec l'id : " + id));

        periodeVote.setClosLe(LocalDate.now());
        periodeVote.setStatut(false);

        return periodeVoteRepository.save(periodeVote);
    }

    public void delete(Long id) {
        if (!periodeVoteRepository.existsById(id)) {
            throw new IllegalArgumentException("Période introuvable avec l'id : " + id);
        }
        periodeVoteRepository.deleteById(id);
    }
}