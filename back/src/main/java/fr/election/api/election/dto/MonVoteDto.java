package fr.election.api.election.dto;

import java.util.List;

public record MonVoteDto(boolean inscrit, List<DuelDto> duels) {
}
