package fr.election.checkin.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.checkin.model.Bulletin;

public interface BulletinRepository extends JpaRepository<Bulletin, Integer> {

	boolean existsByInscription_IdInscription(Integer idInscription);

}
