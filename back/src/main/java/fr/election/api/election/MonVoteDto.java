package fr.election.api.election;

import java.util.List;

public record MonVoteDto(boolean inscrit, List<DuelDto> duels) {
}
