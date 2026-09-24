package fr.election.api.repository;

import java.util.Optional;

import org.springframework.data.repository.Repository;

import fr.election.api.model.CandidatLogo;

// Lecture seule volontairement : CandidatLogo pointe sur la table candidat, un delete supprimerait le candidat.
// Les modifications passent par l'entité chargée (enregistrée à la fin de la transaction)
public interface CandidatLogoRepository extends Repository<CandidatLogo, Integer> {

	Optional<CandidatLogo> findById(Integer idCandidat);

}
