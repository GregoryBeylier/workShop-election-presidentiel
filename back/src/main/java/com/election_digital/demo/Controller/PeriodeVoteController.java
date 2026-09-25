package com.election_digital.demo.Controller;

import com.election_digital.demo.Model.PeriodeVote;
import com.election_digital.demo.Service.PeriodeVoteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/periodes")
public class PeriodeVoteController {

    private final PeriodeVoteService periodeVoteService;

    public PeriodeVoteController(PeriodeVoteService periodeVoteService) {
        this.periodeVoteService = periodeVoteService;
    }

    @GetMapping
    public List<PeriodeVote> getAll() {
        return periodeVoteService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<PeriodeVote> getById(@PathVariable Long id) {
        return periodeVoteService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/actives")
    public List<PeriodeVote> getActives() {
        return periodeVoteService.findActives();
    }

    @GetMapping("/en-cours")
    public ResponseEntity<PeriodeVote> getEnCours() {
        return periodeVoteService.findPeriodeEnCours()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/sans-cloture")
    public List<PeriodeVote> getSansCloture() {
        return periodeVoteService.findSansCloture();
    }

    @PostMapping
    public ResponseEntity<PeriodeVote> create(@RequestBody PeriodeVote periodeVote) {
        PeriodeVote created = periodeVoteService.create(periodeVote);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PatchMapping("/{id}/cloturer")
    public ResponseEntity<PeriodeVote> cloturer(@PathVariable Long id) {
        try {
            PeriodeVote periode = periodeVoteService.cloturer(id);
            return ResponseEntity.ok(periode);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        try {
            periodeVoteService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}