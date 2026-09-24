package fr.election.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.JournalCheckin;

public interface JournalCheckinRepository extends JpaRepository<JournalCheckin, Integer> {

	List<JournalCheckin> findByIdUtilisateur(Integer idUtilisateur);

}
