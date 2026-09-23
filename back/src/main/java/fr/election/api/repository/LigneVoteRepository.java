package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.LigneVote;

public interface LigneVoteRepository extends JpaRepository<LigneVote, Integer> {

}
