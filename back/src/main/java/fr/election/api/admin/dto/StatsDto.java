package fr.election.api.admin.dto;

import java.util.List;

import fr.election.api.election.dto.PeriodeDto;
import fr.election.api.election.dto.ResultatCandidatDto;

// Tableau de bord temps réel ; periode null s'il n'existe encore aucun scrutin
// nbEnCours = électeurs ayant commencé sans finir ; nbDuelsVotes = lignes de vote enregistrées
public record StatsDto(PeriodeDto periode, long nbEnCours, long nbDuelsVotes, List<ResultatCandidatDto> classement,
		List<DuelStatsDto> duels) {
}
