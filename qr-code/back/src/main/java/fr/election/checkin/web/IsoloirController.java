package fr.election.checkin.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonProperty;

import fr.election.checkin.service.IsoloirService;
import fr.election.checkin.service.QrTokenService.QrCourant;

@RestController
@RequestMapping("/api/booths")
public class IsoloirController {

	public record QrCourantDto(@JsonProperty("qr_payload") String qrPayload, @JsonProperty("expires_in") long expiresIn) {}

	private final IsoloirService isoloirService;

	public IsoloirController(IsoloirService isoloirService) {
		this.isoloirService = isoloirService;
	}

	// Appelé chaque seconde par la tablette de l'isoloir
	@GetMapping("/{id}/current-qr")
	public QrCourantDto currentQr(@PathVariable Integer id,
			@RequestHeader(name = "X-Isoloir-Cle", required = false) String cleTablette) {
		QrCourant qr = isoloirService.qrCourant(id, cleTablette);
		return new QrCourantDto(qr.payload(), qr.expireDansMs());
	}

}
