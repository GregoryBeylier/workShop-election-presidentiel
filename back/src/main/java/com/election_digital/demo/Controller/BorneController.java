package com.election_digital.demo.Controller;

import com.election_digital.demo.Model.*;
import com.election_digital.demo.Repository.InscriptionRepository;
import com.election_digital.demo.Service.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bornes")
public class BorneController {

    private final BorneService borneService;
    private final VoteSessionService voteSessionService;
    private final AffrontementService affrontementService;
    private final PeriodeVoteService periodeVoteService;
    private final BulletinService bulletinService;
    private final LigneVoteService ligneVoteService;
    private final InscriptionRepository inscriptionRepository;

    public BorneController(BorneService borneService,
                           VoteSessionService voteSessionService,
                           AffrontementService affrontementService,
                           PeriodeVoteService periodeVoteService,
                           BulletinService bulletinService,
                           LigneVoteService ligneVoteService,
                           InscriptionRepository inscriptionRepository) {
        this.borneService = borneService;
        this.voteSessionService = voteSessionService;
        this.affrontementService = affrontementService;
        this.periodeVoteService = periodeVoteService;
        this.bulletinService = bulletinService;
        this.ligneVoteService = ligneVoteService;
        this.inscriptionRepository = inscriptionRepository;
    }

    // ---- B1 : health check ----
    @GetMapping("/../health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    // ---- D1 : liste des bornes (admin) ----
    @GetMapping
    public List<Borne> getAll() {
        return borneService.findAll();
    }

    // ---- D2 : génère la clé de la borne (admin) ----
    @PostMapping("/{idBorne}/cle")
    public ResponseEntity<?> genererCle(@PathVariable Long idBorne) {
        try {
            String cle = borneService.genererCle(idBorne);
            return ResponseEntity.ok(Map.of("cle", cle));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ---- B2 : état de la borne (polling toutes les 2s) ----
    @GetMapping("/{idBorne}/etat")
    public ResponseEntity<?> getEtat(@PathVariable Long idBorne) {
        return borneService.findById(idBorne)
                .map(borne -> {
                    borneService.marquerEnLigne(idBorne, true);

                    if (borne.getEtat() == Borne.EtatBorne.LIBRE) {
                        return ResponseEntity.ok(Map.of("etat", "LIBRE"));
                    }

                    VoteSessionService.VoteSession session = voteSessionService.getSession(idBorne);
                    if (session == null) {
                        // Sécurité : incohérence, on repasse la borne en LIBRE
                        borneService.liberer(idBorne);
                        return ResponseEntity.ok(Map.of("etat", "LIBRE"));
                    }

                    return ResponseEntity.ok(Map.of(
                            "etat", "DEVERROUILLEE",
                            "jeton", session.getJeton(),
                            "duel", toDuelDTO(session.getDuelCourant())
                    ));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ---- B3 : enregistre le choix du votant ----
    @PostMapping("/{idBorne}/choix")
    public ResponseEntity<?> choix(@PathVariable Long idBorne, @RequestBody ChoixRequest request) {
        VoteSessionService.VoteSession session = voteSessionService.getSession(idBorne);
        if (session == null) {
            return ResponseEntity.badRequest().body("Aucun vote en cours sur cette borne.");
        }

        Affrontement duel = session.getDuelCourant();
        Candidat candidatChoisi = switch (request.choix().toUpperCase()) {
            case "GAUCHE" -> duel.getCandidat1();
            case "DROITE" -> duel.getCandidat2();
            case "BLANC" -> null;
            default -> throw new IllegalArgumentException("Choix invalide : " + request.choix());
        };

        session.getChoix().add(new VoteSessionService.ChoixProvisoire(duel, candidatChoisi));

        if (session.isDernierDuel()) {
            Inscription inscription = inscriptionRepository.findById(session.getIdInscription())
                    .orElseThrow(() -> new IllegalStateException("Inscription introuvable pour cette session."));

            Bulletin bulletin = bulletinService.create(inscription);

            for (VoteSessionService.ChoixProvisoire cp : session.getChoix()) {
                if (cp.getCandidatChoisi() != null) {
                    ligneVoteService.create(bulletin, cp.getAffrontement(), cp.getCandidatChoisi());
                }
            }

            voteSessionService.terminerSession(idBorne);
            borneService.liberer(idBorne);

            return ResponseEntity.ok(Map.of("status", "TERMINE"));
        }

        session.passerAuDuelSuivant();
        return ResponseEntity.ok(Map.of("duel", toDuelDTO(session.getDuelCourant())));
    }

    // ---- B4 : abandon du vote en cours ----
    @PostMapping("/{idBorne}/abandon")
    public ResponseEntity<?> abandon(@PathVariable Long idBorne) {
        try {
            voteSessionService.terminerSession(idBorne);
            borneService.liberer(idBorne);
            return ResponseEntity.ok(Map.of("etat", "LIBRE"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ---- Endpoint TEMPORAIRE pour tester B2/B3/B4 sans A1/JWT ----
    // À supprimer une fois la route A1 (déverrouillage électeur) en place.
    @PostMapping("/{idBorne}/test-deverrouiller")
    public ResponseEntity<?> testDeverrouiller(@PathVariable Long idBorne, @RequestParam Long idInscription) {
        PeriodeVote periode = periodeVoteService.findPeriodeEnCours()
                .orElseThrow(() -> new IllegalStateException("Aucune période de vote en cours."));

        List<Affrontement> duels = affrontementService.findByPeriodeOrdonnes(periode);

        borneService.deverrouiller(idBorne);
        VoteSessionService.VoteSession session = voteSessionService.demarrerSession(idBorne, idInscription, duels);

        return ResponseEntity.ok(Map.of(
                "etat", "DEVERROUILLEE",
                "jeton", session.getJeton(),
                "duel", toDuelDTO(session.getDuelCourant())
        ));
    }

    private Map<String, Object> toDuelDTO(Affrontement duel) {
        return Map.of(
                "idAffrontement", duel.getIdAffrontement(),
                "candidat1", Map.of("id", duel.getCandidat1().getIdCandidat(), "nom", duel.getCandidat1().getNom(), "prenom", duel.getCandidat1().getPrenom()),
                "candidat2", Map.of("id", duel.getCandidat2().getIdCandidat(), "nom", duel.getCandidat2().getNom(), "prenom", duel.getCandidat2().getPrenom())
        );
    }

    public record ChoixRequest(String choix) {
    }
}