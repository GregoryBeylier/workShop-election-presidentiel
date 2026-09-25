package fr.election.api.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// libelle : nom affiché, par exemple "Isoloir 1" ; ipBorne : IP fixe de l'ESP32 sur le Wi-Fi, par exemple "192.168.50.21"
public record IsoloirRequest(
		@NotBlank @Size(max = 50) String libelle,
		@NotBlank
		@Pattern(regexp = "^((25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$",
				message = "Adresse IP invalide (format attendu : 192.168.50.21)")
		String ipBorne) {
}
