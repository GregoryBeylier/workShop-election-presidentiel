package fr.election.api.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "candidat_photo")
public class CandidatPhoto extends ImageCandidat {
}
