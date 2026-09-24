-- Borne de vote (ESP32) : ce que le check-in QR attend en base.
-- À lancer une seule fois, APRÈS migration-postgres.sql. Contrat complet : borne/API.md.
-- La table choix_provisoire (duels en cours sur la borne) est créée par l'équipe des routes /api/borne.

BEGIN;

-- SHA-256 (hex) de la clé de la borne de cet isoloir (en-tête X-Borne-Cle). NULL = isoloir sans borne
ALTER TABLE isoloir ADD COLUMN cle_borne_hash VARCHAR(64);

-- Dernier appel de la borne (UTC), mis à jour par /api/borne/etat et /api/borne/choix.
-- Le check-in refuse d'ouvrir un vote sur une borne silencieuse depuis plus de 10 s.
ALTER TABLE isoloir ADD COLUMN derniere_activite_borne TIMESTAMP;

-- Deux nouveaux refus de scan : borne hors ligne, borne occupée par un autre votant
ALTER TABLE journal_checkin DROP CONSTRAINT chk_resultat_checkin;
ALTER TABLE journal_checkin ADD CONSTRAINT chk_resultat_checkin CHECK (resultat IN
	('success', 'already_voted', 'expired_token', 'invalid_token', 'not_registered', 'booth_offline', 'booth_busy'));

COMMIT;
