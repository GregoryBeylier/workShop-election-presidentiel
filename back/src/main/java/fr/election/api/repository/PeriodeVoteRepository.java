package fr.election.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.PeriodeVote;

public interface PeriodeVoteRepository extends JpaRepository<PeriodeVote, Integer> {

	// Période en cours = la plus récente
	Optional<PeriodeVote> findFirstByOrderByIdPeriodeDesc();

}
