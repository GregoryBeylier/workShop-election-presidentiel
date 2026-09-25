package com.election_digital.demo.Controller;

import com.election_digital.demo.Model.Affrontement;
import com.election_digital.demo.Model.Bulletin;
import com.election_digital.demo.Model.Candidat;
import com.election_digital.demo.Model.LigneVote;
import com.election_digital.demo.Repository.AffrontementRepository;
import com.election_digital.demo.Repository.BulletinRepository;
import com.election_digital.demo.Repository.CandidatRepository;
import com.election_digital.demo.Service.LigneVoteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lignes-vote")
public class LigneVoteController {

    private final LigneVoteService ligneVoteService;
    private final BulletinRepository bulletinRepository;
    private final AffrontementRepository affrontementRepository;
    private final CandidatRepository candidatRepository;

    public LigneVoteController(LigneVoteService ligneVoteService,
                               BulletinRepository bulletinRepository,
                               AffrontementRepository affrontementRepository,
                               CandidatRepository candidatRepository) {
        this.ligneVoteService = ligneVoteService;
        this.bulletinRepository = bulletinRepository;
        this.affrontementRepository = affrontementRepository;
        this.candidatRepository = candidatRepository;
    }

    @GetMapping
    public List<LigneVote> getAll() {
        return ligneVoteService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<LigneVote> getById(@PathVariable Long id) {
        return ligneVoteService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/affrontement/{idAffrontement}")
    public ResponseEntity<List<LigneVote>> getByAffrontement(@PathVariable Long idAffrontement) {
        return affrontementRepository.findById(idAffrontement)
                .map(affrontement -> ResponseEntity.ok(ligneVoteService.findByAffrontement(affrontement)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/affrontement/{idAffrontement}/voix/{idCandidat}")
    public ResponseEntity<Long> compterVoix(@PathVariable Long idAffrontement, @PathVariable Long idCandidat) {
        return affrontementRepository.findById(idAffrontement)
                .map(affrontement -> ResponseEntity.ok(ligneVoteService.compterVoixPourCandidat(affrontement, idCandidat)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody LigneVoteRequest request) {
        Bulletin bulletin = bulletinRepository.findById(request.idBulletin())
                .orElse(null);
        Affrontement affrontement = affrontementRepository.findById(request.idAffrontement())
                .orElse(null);
        Candidat candidat = candidatRepository.findById(request.idCandidatChoisi())
                .orElse(null);

        if (bulletin == null || affrontement == null || candidat == null) {
            return ResponseEntity.badRequest().body("Bulletin, affrontement ou candidat introuvable.");
        }

        try {
            LigneVote created = ligneVoteService.create(bulletin, affrontement, candidat);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            ligneVoteService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    public record LigneVoteRequest(Long idBulletin, Long idAffrontement, Long idCandidatChoisi) {
    }
}