package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.Affrontement;

public interface AffrontementRepository extends JpaRepository<Affrontement, Integer> {

}
