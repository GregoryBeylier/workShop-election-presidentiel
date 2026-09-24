package fr.election.api.election.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

// etat : PREPARATION (candidats modifiables), OUVERT (vote en cours), CLOS (résultats publiés)
// closLe : clôture prévue tant que le scrutin est ouvert, clôture effective ensuite
// nbVotants = électeurs ayant voté tous les duels de la période
public record PeriodeDto(Integer id, String etat, boolean ouverte, LocalDate ouvertLe, LocalDateTime closLe,
		int nbDuels, long nbInscrits, long nbVotants) {
}
