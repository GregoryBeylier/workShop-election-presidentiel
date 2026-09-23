package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.Inscription;

public interface InscriptionRepository extends JpaRepository<Inscription, Integer> {

}
