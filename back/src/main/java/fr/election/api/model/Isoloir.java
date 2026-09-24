package fr.election.api.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "isoloir")
public class Isoloir {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id_isoloir")
	private Integer idIsoloir;

	// ex : "Isoloir 1"
	@Column(name = "libelle", nullable = false, length = 50)
	private String libelle;

	@Column(name = "actif", nullable = false)
	private boolean actif = true;

	// Clé HMAC (hex) qui signe les QR de cet isoloir, jamais envoyée à un client
	@Column(name = "cle_hmac", nullable = false, length = 64)
	private String cleHmac;

	// SHA-256 (hex) de la clé que la tablette présente pour récupérer son QR
	@Column(name = "cle_tablette_hash", nullable = false, length = 64)
	private String cleTabletteHash;

	// SHA-256 (hex) de la clé de la borne (ESP32) de cet isoloir. null = isoloir sans borne
	@Column(name = "cle_borne_hash", length = 64)
	private String cleBorneHash;

	// Dernier appel de la borne (GET /api/borne/etat ou POST /api/borne/choix), en UTC
	@Column(name = "derniere_activite_borne")
	private LocalDateTime derniereActiviteBorne;

	public Integer getIdIsoloir() { return idIsoloir; }
	public String getLibelle() { return libelle; }
	public void setLibelle(String libelle) { this.libelle = libelle; }
	public boolean isActif() { return actif; }
	public void setActif(boolean actif) { this.actif = actif; }
	public String getCleHmac() { return cleHmac; }
	public void setCleHmac(String cleHmac) { this.cleHmac = cleHmac; }
	public String getCleTabletteHash() { return cleTabletteHash; }
	public void setCleTabletteHash(String cleTabletteHash) { this.cleTabletteHash = cleTabletteHash; }
	public String getCleBorneHash() { return cleBorneHash; }
	public void setCleBorneHash(String cleBorneHash) { this.cleBorneHash = cleBorneHash; }
	public LocalDateTime getDerniereActiviteBorne() { return derniereActiviteBorne; }
	public void setDerniereActiviteBorne(LocalDateTime derniereActiviteBorne) { this.derniereActiviteBorne = derniereActiviteBorne; }
	public boolean aUneBorne() { return cleBorneHash != null; }

}
