package com.election_digital.demo.Repository;

import com.election_digital.demo.Model.Bulletin;
import com.election_digital.demo.Model.Inscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BulletinRepository extends JpaRepository<Bulletin, Long> {

    Optional<Bulletin> findByInscription(Inscription inscription);

    boolean existsByInscription(Inscription inscription);
}