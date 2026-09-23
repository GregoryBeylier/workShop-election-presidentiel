package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.Candidat;

public interface CandidatRepository extends JpaRepository<Candidat, Integer> {

}
