package com.election_digital.demo.Service;

import com.election_digital.demo.Model.Affrontement;
import com.election_digital.demo.Model.Bulletin;
import com.election_digital.demo.Model.Candidat;
import com.election_digital.demo.Model.LigneVote;
import com.election_digital.demo.Repository.LigneVoteRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LigneVoteService {

    private final LigneVoteRepository ligneVoteRepository;

    public LigneVoteService(LigneVoteRepository ligneVoteRepository) {
        this.ligneVoteRepository = ligneVoteRepository;
    }

    public List<LigneVote> findAll() {
        return ligneVoteRepository.findAll();
    }

    public Optional<LigneVote> findById(Long id) {
        return ligneVoteRepository.findById(id);
    }

    public List<LigneVote> findByBulletin(Bulletin bulletin) {
        return ligneVoteRepository.findByBulletin(bulletin);
    }

    public List<LigneVote> findByAffrontement(Affrontement affrontement) {
        return ligneVoteRepository.findByAffrontement(affrontement);
    }

    public long compterVoixPourCandidat(Affrontement affrontement, Long idCandidat) {
        return ligneVoteRepository.countByAffrontementAndCandidatChoisiId(affrontement, idCandidat);
    }

    public LigneVote create(Bulletin bulletin, Affrontement affrontement, Candidat candidatChoisi) {
        if (ligneVoteRepository.existsByBulletinAndAffrontement(bulletin, affrontement)) {
            throw new IllegalArgumentException("Ce bulletin a déjà voté pour cet affrontement.");
        }
        LigneVote ligneVote = new LigneVote(null, bulletin, affrontement, candidatChoisi);
        return ligneVoteRepository.save(ligneVote);
    }

    public void delete(Long id) {
        if (!ligneVoteRepository.existsById(id)) {
            throw new IllegalArgumentException("Ligne de vote introuvable avec l'id : " + id);
        }
        ligneVoteRepository.deleteById(id);
    }
}