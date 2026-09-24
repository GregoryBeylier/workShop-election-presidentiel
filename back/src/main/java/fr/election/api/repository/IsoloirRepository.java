package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.Isoloir;

public interface IsoloirRepository extends JpaRepository<Isoloir, Integer> {
}
