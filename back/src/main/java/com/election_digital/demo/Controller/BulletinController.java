package com.election_digital.demo.Controller;

import com.election_digital.demo.Model.Bulletin;
import com.election_digital.demo.Model.Inscription;
import com.election_digital.demo.Repository.InscriptionRepository;
import com.election_digital.demo.Service.BulletinService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bulletins")
public class BulletinController {

    private final BulletinService bulletinService;
    private final InscriptionRepository inscriptionRepository;

    public BulletinController(BulletinService bulletinService, InscriptionRepository inscriptionRepository) {
        this.bulletinService = bulletinService;
        this.inscriptionRepository = inscriptionRepository;
    }

    @GetMapping
    public List<Bulletin> getAll() {
        return bulletinService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bulletin> getById(@PathVariable Long id) {
        return bulletinService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/inscription/{idInscription}")
    public ResponseEntity<Bulletin> getByInscription(@PathVariable Long idInscription) {
        return inscriptionRepository.findById(idInscription)
                .flatMap(bulletinService::findByInscription)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody BulletinRequest request) {
        Inscription inscription = inscriptionRepository.findById(request.idInscription())
                .orElse(null);

        if (inscription == null) {
            return ResponseEntity.badRequest().body("Inscription introuvable.");
        }

        try {
            Bulletin created = bulletinService.create(inscription);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            bulletinService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    public record BulletinRequest(Long idInscription) {
    }
}