# Astra Studio

Base full-stack opérationnelle pour le site Astra Studio.

Le projet conserve le site public premium en HTML / CSS / JS statiques, mais il repose désormais sur un backend Node.js / Express avec SQLite, envoi d’e-mails SMTP, authentification admin par session, cockpit interne métier et plateforme de formation premium (paiement, espace élève, progression, devoirs).

## Vision d’ensemble

### Ce qui reste côté public

Les pages éditoriales restent statiques pour préserver les performances et la direction artistique :

- `index.html`
- `about.html`
- `vision.html`
- `services.html`
- `diagnostic.html`
- `work.html`
- `results.html`
- `contact.html`

### Ce qui est backendisé

Le backend gère les briques réellement business :

- formulaire de contact / devis ;
- pré-diagnostic Astra Signal assisté par IA ;
- validation serveur et anti-spam simple ;
- stockage des leads en SQLite ;
- envoi d’e-mails ;
- authentification admin ;
- cockpit interne ;
- CRUD clients / projets / documents / médias / ressources ;
- exports leads CSV / JSON ;
- modules de contenu préparés pour les futures évolutions ;
- authentification élève (inscription / connexion / reset mot de passe) ;
- tunnel de paiement Stripe pour les formations ;
- accès conditionnel aux cours après achat ;
- suivi de progression leçon par leçon ;
- remise de devoirs avec upload de captures/fichiers ;
- back-office formations pour piloter les élèves, paiements, devoirs et contenus.

## Choix techniques

- **Node.js + Express** : stack légère, claire et fiable pour un site de studio créatif.
- **SQLite** : base relationnelle simple à maintenir, sans surcomplexité infra.
- **Nodemailer / SMTP** : standard, portable et déployable partout.
- **Session cookie HTTP-only** : plus propre qu’un Basic Auth pour un vrai espace interne.
- **Stripe Checkout** : paiement réel et sécurisé côté serveur.
- **Multer** : gestion des uploads devoirs côté backend.
- **Front public statique** : pas de framework inutile là où le site n’en a pas besoin.

## Arborescence utile

```text
.
├── backend/
│   ├── scripts/
│   │   ├── init-db.js
│   │   └── verify.js
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       ├── db/
│       ├── middleware/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       ├── validation/
│       └── views/
├── css/
├── js/
├── assets/
├── data/
│   └── astra-studio.sqlite
├── package.json
├── .env.example
└── pages HTML publiques
```

## Modèle de données

### Tables principales

- `leads`
- `clients`
- `projects`
- `documents`
- `media_items`
- `resources`
- `activity_logs`
- `app_settings`
- `content_modules`
- `academy_users`
- `academy_sessions`
- `academy_password_resets`
- `academy_courses`
- `academy_modules`
- `academy_lessons`
- `academy_resources`
- `academy_enrollments`
- `academy_purchases`
- `academy_lesson_progress`
- `academy_submissions`
- `academy_submission_attachments`

### Relations métier

- un **lead** peut être converti en **client** ;
- un **client** peut avoir plusieurs **projects** ;
- un **project** peut avoir plusieurs **documents** ;
- un **project** peut avoir plusieurs **media_items** ;
- un **document** peut être relié à un client et/ou un projet ;
- un **média** peut être relié à un client et/ou un projet ;
- les actions importantes alimentent `activity_logs` pour le dashboard.
- un **élève** peut avoir plusieurs **enrollments** ;
- une **formation** contient plusieurs **modules** et **lessons** ;
- une **purchase** validée crée (ou active) un **enrollment** ;
- la progression est stockée dans `academy_lesson_progress` ;
- les devoirs et fichiers sont stockés dans `academy_submissions` et `academy_submission_attachments`.

### Statuts gérés

Leads :

- `new`
- `contacted`
- `quote_sent`
- `won`
- `lost`

Relances commerciales :

- `none`
- `to_follow`
- `waiting_reply`
- `closed`

Projets :

- `draft`
- `planned`
- `in_progress`
- `waiting_feedback`
- `delivered`
- `archived`
- `cancelled`

Clients :

- `prospect`
- `onboarding`
- `active`
- `paused`
- `archived`

## Admin cockpit

L’interface interne est accessible via :

- `/admin/login`
- `/admin`
- `/admin/academy`

### Sections disponibles

- **Dashboard** : vue d’ensemble, activité récente, pipeline estimé, urgences, accès rapides.
- **Leads** : recherche, filtres, détail, notes internes, budget estimé, suivi devis, relance, conversion en client, export CSV / JSON.
- **Clients** : base client, fiches détaillées, historique, liens utiles, relations.
- **Projets** : missions, statuts, priorités, budgets, deadlines, livrables.
- **Documents** : briefs, devis, contrats, factures, notes stratégiques.
- **Médias** : bibliothèque d’assets, visuels, vidéos, liens d’aperçu.
- **Ressources** : outils, templates, liens internes, repères de travail.
- **Paramètres** : état de la base, état SMTP, modules préparés pour les futures évolutions.

## Admin formations (Astra Academy)

L’admin formations est accessible via :

- `/admin/academy`

### Sections disponibles

- **Vue d’ensemble** : métriques élèves, inscriptions, ventes, devoirs en attente.
- **Formations** : catalogue, création de formation, attribution manuelle d’accès.
- **Devoirs** : lecture des soumissions, téléchargement des pièces jointes, changement de statut.
- **Paiements** : suivi des sessions Stripe et des statuts de transaction.
- **Élèves** : base des comptes étudiants et volumétrie d’inscriptions.

## Installation

```bash
npm install
cp .env.example .env
npm run db:init
npm run verify
npm start
```

Le site sera disponible sur :

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

L’admin sera disponible sur :

- [http://127.0.0.1:3000/admin](http://127.0.0.1:3000/admin)
- [http://127.0.0.1:3000/admin/academy](http://127.0.0.1:3000/admin/academy)

L’espace élève sera disponible sur :

- [http://127.0.0.1:3000/learn/login](http://127.0.0.1:3000/learn/login)
- [http://127.0.0.1:3000/learn/dashboard](http://127.0.0.1:3000/learn/dashboard)

### Scripts utiles

- `npm run db:init` : initialise ou met à jour la base SQLite locale.
- `npm run verify` : lance une vérification technique complète sur une base temporaire, sans toucher aux vraies données.
- `npm start` : démarre le site et l’admin.
- `npm run dev` : démarre le serveur en mode watch.

## Configuration

### Variables essentielles

```env
NODE_ENV=development
PORT=3000
HOST=127.0.0.1
TRUST_PROXY=false
SITE_BASE_URL=http://127.0.0.1:3000

# Optionnel si le serveur est lancé depuis un autre répertoire
# ROOT_DIR=/absolute/path/to/astra-studio
# PUBLIC_DIR=/absolute/path/to/astra-studio

DB_FILE=data/astra-studio.sqlite
LEGACY_LEADS_FILE=data/leads.json
UPLOADS_DIR=data/uploads

LEADS_NOTIFY_EMAIL=bonjour@astrastudio.fr

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=bonjour@astrastudio.fr
SMTP_PASS=change-me
SMTP_FROM="Astra Studio <bonjour@astrastudio.fr>"
SMTP_REPLY_TO=bonjour@astrastudio.fr

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_MS=18000

ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
ADMIN_SESSION_SECRET=change-me-very-long-secret
ADMIN_SESSION_TTL_HOURS=168

STUDENT_SESSION_SECRET=change-me-student-very-long-secret
STUDENT_SESSION_TTL_HOURS=720
PASSWORD_RESET_TTL_MINUTES=60
ALLOW_DEV_FAKE_CHECKOUT=true

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CURRENCY=eur

LEAD_RATE_LIMIT_MAX=5
LEAD_RATE_LIMIT_WINDOW_MS=3600000
```

### Identifiants admin

En local, si tu n’as pas encore personnalisé ton `.env` :

- identifiant : `admin`
- mot de passe : `change-me`

Change-les avant toute mise en ligne.

### Stripe (paiements formations)

Le checkout formations dépend de Stripe :

- renseigner `STRIPE_SECRET_KEY` ;
- renseigner `SITE_BASE_URL` ;
- (optionnel recommandé) renseigner `STRIPE_WEBHOOK_SECRET` et brancher le webhook `POST /api/payments/stripe/webhook`.

### Mode paiement simulé (dev)

Pour avancer avant la config Stripe, le backend propose un mode démo local :

- `ALLOW_DEV_FAKE_CHECKOUT=true` (actif uniquement hors production) ;
- le clic sur **Acheter** simule un paiement validé ;
- l’accès à la formation est débloqué immédiatement.

En production, garde ce mode désactivé et utilise Stripe réel.

## E-mails

Le système est prêt pour un vrai SMTP :

- notification interne à la réception d’un lead ;
- e-mail de confirmation au prospect.

Tant que les variables SMTP ne sont pas renseignées, les leads sont bien enregistrés en base, mais aucun e-mail réel n’est envoyé.

## Plateforme formations (flux réel)

### Parcours élève

1. l’utilisateur découvre le catalogue sur `formations.html` ;
2. clique sur **Acheter** ;
3. s’il n’est pas connecté, il passe par `/learn/login` ;
4. Stripe Checkout est créé côté serveur via `/api/student/checkout/session` ;
5. après paiement, retour sur `/learn/checkout/success` ;
6. le backend confirme la session Stripe et active l’accès (`academy_enrollments`) ;
7. l’élève retrouve la formation dans `/learn/dashboard` ;
8. progression et devoirs sont suivis dans l’espace cours `/learn/course?course=...`.

### Devoirs & uploads

- endpoint de remise : `POST /api/student/submissions` (multipart) ;
- fichiers stockés dans `data/uploads/submissions` ;
- historique visible côté élève et côté admin formations.

## Flux de travail réel

### 1. Demande entrante

1. un visiteur remplit le formulaire de [contact.html](/Users/yanisrvl/Documents/Playground/contact.html) ou le parcours [diagnostic.html](/Users/yanisrvl/Documents/Playground/diagnostic.html) ;
2. le diagnostic envoie les réponses vers `POST /api/diagnostic/analyze` ;
3. le backend appelle le modèle IA côté serveur et renvoie un JSON structuré ;
4. le front affiche un pré-diagnostic immédiat avec CTA adapté ;
5. la demande contact/devis est ensuite traitée via `POST /api/leads` et apparaît dans l’admin.

### 2. Qualification commerciale

1. ouvrir la section **Leads** ;
2. filtrer ou rechercher ;
3. ajuster si besoin le budget estimé, le statut de relance, la date de devis et la prochaine relance ;
4. ajouter une note interne ;
5. passer le statut à `contacted`, `quote_sent`, `won` ou `lost` ;
6. convertir le lead en client si la collaboration démarre.

### 3. Suivi opérationnel

1. créer la fiche **Client** ;
2. créer un **Projet** relié au client ;
3. rattacher les **Documents** utiles ;
4. rattacher les **Médias** utiles ;
5. centraliser les modèles et liens dans **Ressources**.

## Endpoints clés

### Public

- `GET /api/health`
- `GET /api/site/bootstrap`
- `POST /api/leads`
- `POST /api/diagnostic/analyze`

### Student / LMS

- `GET /api/student/session`
- `POST /api/student/auth/signup`
- `POST /api/student/auth/login`
- `POST /api/student/auth/logout`
- `POST /api/student/auth/forgot-password`
- `POST /api/student/auth/reset-password`
- `GET /api/student/courses`
- `POST /api/student/checkout/session`
- `POST /api/student/checkout/confirm`
- `GET /api/student/dashboard`
- `GET /api/student/courses/:courseSlug`
- `POST /api/student/progress`
- `POST /api/student/submissions` (multipart form-data)
- `GET /api/student/submissions`
- `GET /api/student/submissions/attachments/:attachmentId`

### Paiement

- `POST /api/payments/stripe/webhook`

#### Sortie JSON de `/api/diagnostic/analyze`

Le moteur IA renvoie un JSON structuré avec les champs suivants :

- `profile_name`
- `profile_summary`
- `strengths` (3 items)
- `blockers` (3 items)
- `priority`
- `recommended_path` (`formation`, `agence`, `audit_premium`)
- `cta_title`
- `cta_text`

### Admin auth

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/session`

### Admin métier

- `GET /api/admin/dashboard`
- `GET /api/admin/leads`
- `GET /api/admin/leads/:leadId`
- `PATCH /api/admin/leads/:leadId`
- `POST /api/admin/leads/:leadId/convert`
- `GET /api/admin/leads/export.csv`
- `GET /api/admin/leads/export.json`
- `GET/POST/PATCH/DELETE /api/admin/clients`
- `GET/POST/PATCH/DELETE /api/admin/projects`
- `GET/POST/PATCH/DELETE /api/admin/documents`
- `GET/POST/PATCH/DELETE /api/admin/media`
- `GET/POST/PATCH/DELETE /api/admin/resources`
- `GET /api/admin/content/modules`
- `GET /api/admin/settings`

### Admin formations

- `GET /api/admin/academy/overview`
- `GET /api/admin/academy/courses`
- `POST /api/admin/academy/courses`
- `PATCH /api/admin/academy/courses/:courseId`
- `GET /api/admin/academy/courses/:courseId/modules`
- `POST /api/admin/academy/modules`
- `PATCH /api/admin/academy/modules/:moduleId`
- `GET /api/admin/academy/modules/:moduleId/lessons`
- `POST /api/admin/academy/lessons`
- `PATCH /api/admin/academy/lessons/:lessonId`
- `GET /api/admin/academy/users`
- `GET /api/admin/academy/purchases`
- `GET /api/admin/academy/submissions`
- `PATCH /api/admin/academy/submissions/:submissionId`
- `POST /api/admin/academy/enrollments/manual`

## Base de données

Fichier principal :

- `data/astra-studio.sqlite`

Contenu initial semé automatiquement :

- `app_settings`
- `content_modules`

Le script `npm run db:init` :

- crée les tables ;
- crée les index ;
- applique les évolutions de schéma non destructives ;
- sème les réglages de base ;
- prépare les modules de contenu ;
- peut migrer un ancien `data/leads.json` si le fichier existe et si la table `leads` est vide.

Le script `npm run verify` :

- démarre une instance temporaire de l’application ;
- utilise une base SQLite de test isolée ;
- vérifie les routes publiques essentielles ;
- vérifie le login admin ;
- vérifie le flux lead → mise à jour commerciale → conversion en client ;
- nettoie automatiquement les fichiers de test en fin d’exécution.

## Utilisation quotidienne de l’admin

### Créer un client

1. ouvrir **Clients** ;
2. cliquer sur `Nouveau client` ;
3. renseigner le contact, la marque, l’e-mail, les notes et les liens ;
4. enregistrer.

### Créer un projet

1. ouvrir **Projets** ;
2. cliquer sur `Nouveau projet` ;
3. choisir le client lié ;
4. définir mission, statut, priorité, budget et deadline ;
5. enregistrer.

### Ranger un document

1. ouvrir **Documents** ;
2. cliquer sur `Nouveau document` ;
3. renseigner titre, catégorie, type, lien ;
4. rattacher le document au client et/ou au projet ;
5. enregistrer.

### Ajouter un média

1. ouvrir **Médias** ;
2. cliquer sur `Nouveau média` ;
3. renseigner le titre, le type, les liens d’asset ;
4. rattacher au client et/ou au projet ;
5. enregistrer.

### Retrouver une information

Chaque section dispose d’une barre de recherche et de filtres métier :

- statut ;
- type ;
- client ;
- projet ;
- catégorie ;
- priorité.

## Déploiement

Pour une mise en ligne sérieuse :

- définir `NODE_ENV=production` ;
- personnaliser `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` ;
- définir `TRUST_PROXY=true` si l’application est derrière un reverse proxy ;
- configurer les variables SMTP ;
- stocker SQLite sur un volume persistant ;
- sauvegarder régulièrement le fichier SQLite ;
- servir l’application derrière un reverse proxy HTTPS.

## Notes

- L’admin est pensé desktop d’abord, mais reste exploitable sur tablette.
- Le site public garde sa logique statique pour éviter une complexité front inutile.
- La structure est prête à accueillir plus tard une administration plus poussée des résultats et des case studies sans refonte complète.
