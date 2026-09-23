package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.Statistiques;

public interface StatistiquesRepository extends JpaRepository<Statistiques, Integer> {

}
