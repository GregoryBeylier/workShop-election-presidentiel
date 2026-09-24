package fr.election.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.EmargementIsoloir;

public interface EmargementIsoloirRepository extends JpaRepository<EmargementIsoloir, Integer> {

	Optional<EmargementIsoloir> findByInscription_IdInscription(Integer idInscription);

}
