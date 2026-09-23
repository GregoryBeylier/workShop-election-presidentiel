package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.PeriodeVote;

public interface PeriodeVoteRepository extends JpaRepository<PeriodeVote, Integer> {

}
