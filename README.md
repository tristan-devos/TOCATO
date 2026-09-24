# TOCATO

Application de mise en relation entre clients et prestataires de services à domicile
(plombier, déménageur, jardinier), lancée à Montréal. Ce dépôt contient la partie client,
construite avec Expo (iOS / Android / web).

## Tester l'app sans rien installer (Expo Go)

Sur iPhone ou Android, installer [Expo Go](https://expo.dev/go), puis scanner ce QR code avec
l'appareil photo (ou l'ouvrir dans un navigateur et toucher le lien) :
**https://qr.expo.dev/eas-update?projectId=83c31465-c53d-4aac-b3be-615809d04420&runtimeVersion=exposdk:57.0.0&channel=preview**

Il ouvre toujours la dernière version publiée (`npx eas-cli update --branch preview …`, voir
[AGENTS.md](./AGENTS.md) > Déploiement). Après la première ouverture, TOCATO reste dans
« Recently opened » d'Expo Go ; fermer et rouvrir l'app récupère la dernière version.

## Lancer l'app

Prérequis : un projet Supabase configuré (voir [AGENTS.md](./AGENTS.md), section
Commandes > Supabase).

```bash
npm install
cp .env.example .env   # puis remplir l'URL de l'API (https://<ref>.supabase.co) et la clé anon
npx expo start
```

- iPhone : scanner le QR code avec l'app [Expo Go](https://expo.dev/go).
- Web : appuyer sur `w` dans le terminal.

Les données (comptes, réservations, conversations, photos) vivent dans Supabase. Il n'y
a plus de prestataires simulés : pour tester, utiliser deux comptes, un client et un
prestataire approuvé par l'admin (voir AGENTS.md > Admin et prestataires réels).

## Fonctionnalités

- **Accueil** : accroche « Décrire mon besoin », réservation en cours, services,
  prestataires populaires, ce que TOCATO vérifie chez chaque prestataire
- **Messages** : un chat s'ouvre avec le prestataire à chaque demande ; les devis
  s'acceptent ou se refusent directement dans la conversation (célébration à
  l'acceptation)
- **Réserver** (bouton central) : demande guidée en quelques questions : photos, adresse,
  date et estimation de prix
- **Mes réservations** : suivi en cours / historique, statut en une phrase (« 2 offres
  reçues », « Marc interviendra demain »), offres reçues avec la photo du prestataire,
  annulation
- **Profil** : adresses, paiement, aide

**Côté prestataire** : adhésion depuis l'app (« Je suis prestataire » à l'inscription :
entreprise, NEQ, licence RBQ en plomberie, pièces et photo), approuvée par l'admin. Puis
**Accueil** (prochaine mission, chiffres clés, calendrier), **Demandes** ouvertes de ses
services (ville et secteur seulement), devis, **Mes travaux** (adresse exacte une fois le
devis accepté, commencer / terminer l'intervention), **Messages**, **Profil** (photo,
validée par l'admin).

**Côté admin** (Profil → Adhésions prestataires) : examen des demandes (vérification RBQ,
pièces), approbation ou refus avec motif, validation des photos.

## Documentation technique

Voir [AGENTS.md](./AGENTS.md) : stack, architecture, conventions et commandes.

Documents de conception : [docs/](./docs/) :
[interface prestataire](./docs/interface-prestataire.md),
[adhésion des prestataires](./docs/adhesion-prestataires.md),
[expérience émotionnelle](./docs/experience-emotionnelle.md).
