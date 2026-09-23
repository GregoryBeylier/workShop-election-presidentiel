package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import fr.election.api.model.Admin;

public interface AdminRepository extends JpaRepository<Admin, Integer> {

	boolean existsByUtilisateurIdUtilisateur(Integer idUtilisateur);

	@Modifying
	@Query("delete from Admin a where a.utilisateur.idUtilisateur = :idUtilisateur")
	void supprimerDroits(Integer idUtilisateur);

}
