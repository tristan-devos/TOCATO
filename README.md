# TOCATO

Application de mise en relation entre clients et prestataires de services à domicile
(plombier, déménageur, jardinier), lancée à Montréal. Ce dépôt contient la partie client,
construite avec Expo (iOS / Android / web).

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

Les données (comptes, réservations, conversations, photos) vivent dans Supabase. Les
prestataires de démo répondent via une simulation côté serveur (Edge Function
`provider-reply`), sauf dans les services couverts par un vrai prestataire. « Profil → Réinitialiser la démo » recharge le scénario de démo.

## Fonctionnalités

- **Accueil** — services, réservation en cours, prestataires populaires
- **Messages** — un chat s'ouvre avec le prestataire à chaque demande ; les devis
  s'acceptent ou se refusent directement dans la conversation
- **Réserver** (bouton central) — demande guidée en quelques questions : photos, adresse,
  date et estimation de prix
- **Mes réservations** — suivi en cours / historique, statut détaillé, annulation
- **Profil** — adresses, paiement, aide

**Côté prestataire** (compte relié à une fiche par un admin, voir
[AGENTS.md](./AGENTS.md) > *Relier un prestataire réel*) : **Demandes** ouvertes de ses
services (ville et secteur seulement), devis, **Mes travaux** (adresse exacte une fois le
devis accepté, commencer / terminer l'intervention), **Messages**, **Profil**.

## Documentation technique

Voir [AGENTS.md](./AGENTS.md) : stack, architecture, conventions et commandes.

Conceptions en cours : [docs/](./docs/) — en particulier
[l'interface prestataire](./docs/interface-prestataire.md).
