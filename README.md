# TOCATO

Application de mise en relation entre clients et prestataires de services à domicile
(plombier, déménageur, jardinier), lancée à Montréal. Ce dépôt contient la partie client,
construite avec Expo (iOS / Android / web).

## Lancer l'app

```bash
npm install
npx expo start
```

- iPhone : scanner le QR code avec l'app [Expo Go](https://expo.dev/go).
- Web : appuyer sur `w` dans le terminal.

L'app tourne entièrement avec des données de démo, sans backend. Les réponses des
prestataires dans le chat sont simulées. « Profil → Réinitialiser la démo » restaure les
données de départ.

## Fonctionnalités

- **Accueil** — services, réservation en cours, prestataires populaires
- **Messages** — un chat s'ouvre avec le prestataire à chaque demande ; les devis
  s'acceptent ou se refusent directement dans la conversation
- **Réserver** (bouton central) — demande guidée en quelques questions : photos, adresse,
  date et estimation de prix
- **Mes réservations** — suivi en cours / historique, statut détaillé, annulation
- **Profil** — adresses, paiement, aide

## Documentation technique

Voir [AGENTS.md](./AGENTS.md) : stack, architecture, conventions et commandes.
