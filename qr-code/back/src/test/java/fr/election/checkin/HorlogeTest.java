package fr.election.checkin;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

// Horloge réglable pour piloter les fenêtres de 5 s dans les tests
public class HorlogeTest extends Clock {

	private Instant maintenant;

	public HorlogeTest(Instant maintenant) {
		this.maintenant = maintenant;
	}

	public void regler(Instant maintenant) { this.maintenant = maintenant; }
	public void avancer(long ms) { this.maintenant = maintenant.plusMillis(ms); }

	@Override public ZoneId getZone() { return ZoneOffset.UTC; }
	@Override public Clock withZone(ZoneId zone) { return this; }
	@Override public Instant instant() { return maintenant; }

}
