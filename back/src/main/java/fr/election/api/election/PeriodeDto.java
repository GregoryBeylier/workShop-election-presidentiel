package fr.election.api.election;

import java.time.LocalDate;

// nbVotants = électeurs ayant voté tous les duels de la période
public record PeriodeDto(Integer id, boolean ouverte, LocalDate ouvertLe, LocalDate closLe,
		int nbDuels, long nbInscrits, long nbVotants) {
}
