package fr.election.api.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;

// Image d'un candidat (photo : table candidat_photo, logo : colonnes logo_* de candidat), dans une entité à part
// pour ne pas charger les octets avec chaque candidat.
// candidat.photo / candidat.logo contient l'URL publique (versionnée) qui sert cette image
@MappedSuperclass
public abstract class ImageCandidat {

	@Id
	@Column(name = "id_candidat")
	private Integer idCandidat;

	@Column(name = "contenu", nullable = false)
	private byte[] contenu;

	@Column(name = "type_mime", nullable = false, length = 50)
	private String typeMime;

	@Column(name = "maj_le", nullable = false)
	private LocalDateTime majLe = LocalDateTime.now();

	public Integer getIdCandidat() { return idCandidat; }
	public void setIdCandidat(Integer idCandidat) { this.idCandidat = idCandidat; }
	public byte[] getContenu() { return contenu; }
	public void setContenu(byte[] contenu) { this.contenu = contenu; }
	public String getTypeMime() { return typeMime; }
	public void setTypeMime(String typeMime) { this.typeMime = typeMime; }
	public LocalDateTime getMajLe() { return majLe; }
	public void setMajLe(LocalDateTime majLe) { this.majLe = majLe; }

}
