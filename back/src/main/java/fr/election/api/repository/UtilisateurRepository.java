package fr.election.api.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.Utilisateur;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Integer> {

	Optional<Utilisateur> findByEmail(String email);

	boolean existsByEmail(String email);

}
