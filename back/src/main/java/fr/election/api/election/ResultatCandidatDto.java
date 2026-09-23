package fr.election.api.election;

import java.math.BigDecimal;

public record ResultatCandidatDto(CandidatDto candidat, BigDecimal points, int victoires, int egalites,
		int defaites) {
}
