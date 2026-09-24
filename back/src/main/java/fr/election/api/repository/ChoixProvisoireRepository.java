package fr.election.api.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.ChoixProvisoire;

public interface ChoixProvisoireRepository extends JpaRepository<ChoixProvisoire, ChoixProvisoire.Cle> {

	List<ChoixProvisoire> findByIdEmargement(Integer idEmargement);

	void deleteByIdEmargement(Integer idEmargement);

}
