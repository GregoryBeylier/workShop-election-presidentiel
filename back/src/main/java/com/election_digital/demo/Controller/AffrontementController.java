package com.election_digital.demo.Controller;

import com.election_digital.demo.Model.Affrontement;
import com.election_digital.demo.Model.Candidat;
import com.election_digital.demo.Repository.CandidatRepository;
import com.election_digital.demo.Service.AffrontementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/affrontements")
public class AffrontementController {

    private final AffrontementService affrontementService;
    private final CandidatRepository candidatRepository;

    public AffrontementController(AffrontementService affrontementService, CandidatRepository candidatRepository) {
        this.affrontementService = affrontementService;
        this.candidatRepository = candidatRepository;
    }

    @GetMapping
    public List<Affrontement> getAll() {
        return affrontementService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Affrontement> getById(@PathVariable Long id) {
        return affrontementService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/candidat/{idCandidat}")
    public ResponseEntity<List<Affrontement>> getByCandidat(@PathVariable Long idCandidat) {
        return candidatRepository.findById(idCandidat)
                .map(candidat -> ResponseEntity.ok(affrontementService.findByCandidat(candidat)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/choix/{choix}")
    public List<Affrontement> getByChoix(@PathVariable Integer choix) {
        return affrontementService.findByChoix(choix);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody AffrontementRequest request) {
        Candidat candidat1 = candidatRepository.findById(request.idCandidat1())
                .orElse(null);
        Candidat candidat2 = candidatRepository.findById(request.idCandidat2())
                .orElse(null);

        if (candidat1 == null || candidat2 == null) {
            return ResponseEntity.badRequest().body("Un des deux candidats est introuvable.");
        }

        try {
            Affrontement created = affrontementService.create(candidat1, candidat2, request.choix());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            affrontementService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    public record AffrontementRequest(Long idCandidat1, Long idCandidat2, Integer choix) {
    }
}