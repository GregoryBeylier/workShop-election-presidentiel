package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.CandidatLogo;

public interface CandidatLogoRepository extends JpaRepository<CandidatLogo, Integer> {
}
