package fr.election.checkin.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.checkin.model.Isoloir;

public interface IsoloirRepository extends JpaRepository<Isoloir, Integer> {
}
