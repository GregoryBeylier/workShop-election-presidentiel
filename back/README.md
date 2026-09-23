# API — Élection MyDigitalSchool

API Spring Boot (Java 21) de la plateforme de vote, branchée sur la base
PostgreSQL Neon. Le schéma est géré directement dans Neon
(`spring.jpa.hibernate.ddl-auto=validate`).

## Lancer en local

```bash
cp .env.example .env   # puis remplir DB_PASSWORD et JWT_SECRET
./mvnw spring-boot:run -Dspring-boot.run.profiles=demo
```

Le profil `demo` crée les comptes de démo (`root@demo.fr` / `root` pour
l'admin) et un scrutin de démo s'il n'en existe aucun.

## Organisation du code

Le code est rangé **par fonctionnalité** : chaque dossier contient son
contrôleur (les routes), son service (les règles métier) et ses `dto/`
(ce qui entre et sort de l'API en JSON).

```
fr.election.api
├── config/        # SecurityConfig (JWT, CORS, droits par route), DemoDataLoader
├── commun/        # HealthController (/api/health)
├── auth/          # connexion, JWT, mot de passe provisoire / définitif
│   └── dto/
├── election/      # côté électeur : scrutin en cours, vote, résultats
│   └── dto/
├── admin/         # côté admin (/api/admin/**, rôle ADMIN)
│   ├── ScrutinAdminController + ScrutinAdminService          # stats, démarrer / clôturer, candidats
│   ├── UtilisateurAdminController + UtilisateurAdminService  # comptes, mot de passe, RGPD
│   └── dto/
├── model/         # entités JPA (une par table)
└── repository/    # accès à la base (Spring Data JPA)
```

Règles : un contrôleur ne contient pas de logique, il appelle un service ;
seuls les services utilisent les repositories ; les entités ne sortent
jamais de l'API, on renvoie toujours un DTO.
