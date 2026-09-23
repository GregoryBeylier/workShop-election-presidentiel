package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.Bulletin;

public interface BulletinRepository extends JpaRepository<Bulletin, Integer> {

}
