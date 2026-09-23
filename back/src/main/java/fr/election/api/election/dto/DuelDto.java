package fr.election.api.election.dto;

// fait = l'électeur connecté a déjà voté ce duel (son choix n'est jamais renvoyé)
public record DuelDto(Integer id, CandidatDto candidat1, CandidatDto candidat2, boolean fait) {
}
