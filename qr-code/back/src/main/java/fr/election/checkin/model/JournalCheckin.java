package fr.election.checkin.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// Trace de chaque scan, pour audit / debug uniquement (jamais utilisée pour le résultat du vote)
@Entity
@Table(name = "journal_checkin")
public class JournalCheckin {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_journal")
	private Integer idJournal;

	@Column(name = "id_utilisateur")
	private Integer idUtilisateur;

	// null si le QR ne désignait aucun isoloir valide
	@Column(name = "id_isoloir")
	private Integer idIsoloir;

	@Column(name = "scanne_le", nullable = false)
	private LocalDateTime scanneLe;

	// Valeurs autorisées par la contrainte chk_resultat_checkin
	@Column(name = "resultat", nullable = false, length = 20)
	private String resultat;

	public JournalCheckin() {}

	public JournalCheckin(Integer idUtilisateur, Integer idIsoloir, LocalDateTime scanneLe, String resultat) {
		this.idUtilisateur = idUtilisateur;
		this.idIsoloir = idIsoloir;
		this.scanneLe = scanneLe;
		this.resultat = resultat;
	}

	public Integer getIdJournal() { return idJournal; }
	public Integer getIdUtilisateur() { return idUtilisateur; }
	public Integer getIdIsoloir() { return idIsoloir; }
	public LocalDateTime getScanneLe() { return scanneLe; }
	public String getResultat() { return resultat; }

}
