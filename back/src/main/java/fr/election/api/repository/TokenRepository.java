package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import fr.election.api.model.Token;

public interface TokenRepository extends JpaRepository<Token, Integer> {

	// RGPD : efface tous les tokens d'un utilisateur anonymisé
	@Modifying
	@Query("delete from Token t where t.utilisateur.idUtilisateur = :idUtilisateur")
	void supprimerTous(Integer idUtilisateur);

}
