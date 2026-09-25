package com.election_digital.demo.Service;

import com.election_digital.demo.Model.Affrontement;
import com.election_digital.demo.Model.Candidat;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VoteSessionService {

    public static class ChoixProvisoire {
        private final Affrontement affrontement;
        private final Candidat candidatChoisi;

        public ChoixProvisoire(Affrontement affrontement, Candidat candidatChoisi) {
            this.affrontement = affrontement;
            this.candidatChoisi = candidatChoisi;
        }

        public Affrontement getAffrontement() {
            return affrontement;
        }

        public Candidat getCandidatChoisi() {
            return candidatChoisi;
        }
    }

    public static class VoteSession {
        private final Long idBorne;
        private final Long idInscription;
        private final String jeton;
        private final List<Affrontement> affrontements;
        private int indexCourant = 0;
        private final List<ChoixProvisoire> choix = new ArrayList<>();

        public VoteSession(Long idBorne, Long idInscription, String jeton, List<Affrontement> affrontements) {
            this.idBorne = idBorne;
            this.idInscription = idInscription;
            this.jeton = jeton;
            this.affrontements = affrontements;
        }

        public Affrontement getDuelCourant() {
            return affrontements.get(indexCourant);
        }

        public boolean isDernierDuel() {
            return indexCourant == affrontements.size() - 1;
        }

        public void passerAuDuelSuivant() {
            indexCourant++;
        }

        public Long getIdBorne() {
            return idBorne;
        }

        public Long getIdInscription() {
            return idInscription;
        }

        public String getJeton() {
            return jeton;
        }

        public List<ChoixProvisoire> getChoix() {
            return choix;
        }
    }

    private final Map<Long, VoteSession> sessions = new ConcurrentHashMap<>();

    public VoteSession demarrerSession(Long idBorne, Long idInscription, List<Affrontement> affrontements) {
        if (affrontements.isEmpty()) {
            throw new IllegalStateException("Aucun affrontement disponible pour cette période.");
        }
        VoteSession session = new VoteSession(idBorne, idInscription, UUID.randomUUID().toString(), affrontements);
        sessions.put(idBorne, session);
        return session;
    }

    public VoteSession getSession(Long idBorne) {
        return sessions.get(idBorne);
    }

    public void terminerSession(Long idBorne) {
        sessions.remove(idBorne);
    }
}
