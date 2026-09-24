package fr.election.api.admin.dto;

import fr.election.api.election.dto.CandidatDto;

public record DuelStatsDto(Integer id, CandidatDto candidat1, CandidatDto candidat2, int victoires1, int victoires2,
		int egalites) {
}
