-- Données de démo
INSERT INTO periode_vote (statut, ouvert_le) VALUES (TRUE, CURRENT_DATE);

INSERT INTO utilisateur (email, matricule) VALUES
	('alice@mydigitalschool.fr', 'MDS001'),  -- 1 : inscrite, n'a pas voté
	('bob@mydigitalschool.fr', 'MDS002'),    -- 2 : a déjà voté dans l'appli
	('chloe@mydigitalschool.fr', 'MDS003'),  -- 3 : inscrite, n'a pas voté
	('david@mydigitalschool.fr', 'MDS004');  -- 4 : pas inscrit à la période

INSERT INTO inscription (id_utilisateur, id_periode) VALUES (1, 1), (2, 1), (3, 1);
INSERT INTO bulletin (id_inscription) VALUES (2);

-- Clés tablette de démo : "tablette-isoloir-1-demo" et "tablette-isoloir-2-demo" (stockées hachées en SHA-256)
INSERT INTO isoloir (libelle, actif, cle_hmac, cle_tablette_hash) VALUES
	('Isoloir 1', TRUE, '5c7b55f6a0ce90fe05a08974ae4b2c20aeecbb75c8325bbde2436958483f5d6a', '05f6d2d40db2b5c48034210132f40c63487efd636d3bc24cdddf889c4dc91ec1'),
	('Isoloir 2', TRUE, '36ce01b59ea302c1f6365f6c49923a96a0c6b6a4b0f5caf17316690fb2f7d0e0', 'fde908b26361c51fbde08cd227b50cd1015d5b307cc684e808be9b8192452f9d');
