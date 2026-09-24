package fr.election.checkin.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.checkin.model.Utilisateur;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Integer> {
}
