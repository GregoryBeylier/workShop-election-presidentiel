package fr.election.api.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

// Logo du candidat (parti, liste…), affiché en fond de sa carte sur la page de vote
@Entity
@Table(name = "candidat_logo")
public class CandidatLogo extends ImageCandidat {
}
