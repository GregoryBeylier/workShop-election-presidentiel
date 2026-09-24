-- Borne de vote (ESP32) : choix faits duel par duel, en attendant le dernier.
-- À lancer une seule fois, APRÈS migration-borne.sql. Contrat : borne/API.md §5 et §8.
-- Au dernier duel, le back transforme ces choix en bulletin + ligne_vote puis les efface.
-- Cette table n'entre JAMAIS dans le calcul des résultats.

CREATE TABLE choix_provisoire (
	id_emargement INTEGER NOT NULL REFERENCES emargement_isoloir (id_emargement),
	id_affrontement INTEGER NOT NULL REFERENCES affrontement (id_affrontement),
	choix VARCHAR(10) NOT NULL CHECK (choix IN ('GAUCHE', 'DROITE', 'BLANC')),
	-- Un seul choix par duel : un choix renvoyé deux fois par la borne n'est pas doublé
	PRIMARY KEY (id_emargement, id_affrontement)
);
