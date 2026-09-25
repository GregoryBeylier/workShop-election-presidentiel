package com.election_digital.demo.Repository;

import com.election_digital.demo.Model.Inscription;
import com.election_digital.demo.Model.PeriodeVote;
import com.election_digital.demo.Model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InscriptionRepository extends JpaRepository<Inscription, Long> {

    List<Inscription> findByUtilisateur(Utilisateur utilisateur);

    List<Inscription> findByPeriode(PeriodeVote periode);

    Optional<Inscription> findByUtilisateurAndPeriode(Utilisateur utilisateur, PeriodeVote periode);

    boolean existsByUtilisateurAndPeriode(Utilisateur utilisateur, PeriodeVote periode);
}