-- Borne reconnue par son IP fixe au lieu de sa clé (X-Borne-Cle).
-- À lancer une seule fois, AVANT de démarrer la version du back qui identifie la borne par IP
-- (sinon Hibernate refuse de démarrer : colonne ip_borne absente).

BEGIN;

-- IP fixe de l'ESP32 sur le Wi-Fi (ex : 192.168.50.21). NULL = isoloir sans borne
ALTER TABLE isoloir ADD COLUMN ip_borne VARCHAR(45);

-- Deux isoloirs actifs ne peuvent pas avoir la même borne (un isoloir désactivé garde la sienne)
CREATE UNIQUE INDEX uq_isoloir_ip_borne_actif ON isoloir (ip_borne) WHERE actif;

-- L'ancienne clé ne sert plus : les isoloirs existants n'ont plus de borne tant qu'on ne leur donne pas d'IP.
-- Pour garder un isoloir existant, lui donner l'IP de sa borne :
--   UPDATE isoloir SET ip_borne = '192.168.50.21' WHERE id_isoloir = 1;
-- (ou le désactiver dans l'onglet Isoloirs et en recréer un avec l'IP)
-- La colonne cle_borne_hash est laissée en place, inutilisée : la supprimer plus tard si tout va bien.

COMMIT;
