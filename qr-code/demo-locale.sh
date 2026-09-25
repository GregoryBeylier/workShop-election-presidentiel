#!/usr/bin/env bash
# Démo sans base de données : le back tourne sur une base H2 en mémoire, remplie par le profil demo
# (admin root@demo.fr / root, électeur test@mydigitalschool.fr / root, 4 candidats, scrutin ouvert).
# Tout est effacé à l'arrêt (Ctrl+C) : chaque relance repart d'une démo propre.
# Ne touche ni à Neon ni à la base du Raspberry (back/.env est ignoré).
#
# Usage : ./qr-code/demo-locale.sh            (port 8080, comme le back normal)
#         ./qr-code/demo-locale.sh --server.port=8082
set -euo pipefail
cd "$(dirname "$0")/../back"

echo "Compilation…"
./mvnw -q -DskipTests compile
# H2 n'est qu'une dépendance de test : on prend le classpath de test pour l'avoir
./mvnw -q dependency:build-classpath -Dmdep.includeScope=test -Dmdep.outputFile=target/classpath-demo.txt

export JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 48)}"
echo "Démarrage du back de démo (Ctrl+C pour arrêter)…"
exec java -cp "target/classes:$(cat target/classpath-demo.txt)" fr.election.api.ElectionApiApplication \
  --spring.profiles.active=demo \
  "--spring.config.import=" \
  "--spring.datasource.url=jdbc:h2:mem:demo;DB_CLOSE_DELAY=-1" \
  --spring.datasource.username=sa \
  "--spring.datasource.password=" \
  --spring.jpa.hibernate.ddl-auto=create-drop \
  "$@"
