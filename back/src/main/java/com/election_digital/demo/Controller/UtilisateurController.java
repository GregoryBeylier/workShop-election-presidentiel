package com.election_digital.demo.Controller;

import com.election_digital.demo.Model.Utilisateur;
import com.election_digital.demo.Service.UtilisateurService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/utilisateurs")
public class UtilisateurController {

    private final UtilisateurService utilisateurService;

    public UtilisateurController(UtilisateurService utilisateurService) {
        this.utilisateurService = utilisateurService;
    }

    @GetMapping
    public List<Utilisateur> getAll() {
        return utilisateurService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Utilisateur> getById(@PathVariable Long id) {
        return utilisateurService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<Utilisateur> getByEmail(@PathVariable String email) {
        return utilisateurService.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Utilisateur utilisateur) {
        try {
            Utilisateur created = utilisateurService.create(utilisateur);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Utilisateur utilisateurDetails) {
        try {
            Utilisateur updated = utilisateurService.update(id, utilisateurDetails);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            utilisateurService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}