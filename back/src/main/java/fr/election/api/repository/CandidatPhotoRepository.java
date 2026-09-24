package fr.election.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import fr.election.api.model.CandidatPhoto;

public interface CandidatPhotoRepository extends JpaRepository<CandidatPhoto, Integer> {
}
