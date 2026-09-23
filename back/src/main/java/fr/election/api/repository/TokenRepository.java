package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.Token;

public interface TokenRepository extends JpaRepository<Token, Integer> {

}
