package fr.election.api.election.dto;

// idCandidatChoisi null = duel passé, compté comme une égalité
public record VoteRequest(Integer idCandidatChoisi) {
}
