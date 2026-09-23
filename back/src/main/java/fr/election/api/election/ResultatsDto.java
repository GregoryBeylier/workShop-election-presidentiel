package fr.election.api.election;

import java.util.List;

// classement trié par points décroissants
public record ResultatsDto(PeriodeDto periode, List<ResultatCandidatDto> classement) {
}
