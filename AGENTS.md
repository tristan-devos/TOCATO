# TOCATO — guide du repo

Application mobile (côté client) de mise en relation entre clients et prestataires de services
à domicile. Marché de lancement : **Montréal, QC**. Toute l'interface est en **français**.
Services au lancement : plombier, déménageur, jardinier.

> Expo évolue vite : avant toute modification non triviale, lire les docs versionnées
> https://docs.expo.dev/versions/v54.0.0/ (ou https://docs.expo.dev/llms-full.txt).

## Stack

- **Expo SDK 54** (React Native 0.81, React 19.1). **Pin volontaire — ne pas bumper.**
  Le dev sur Windows se fait via **Expo Go** sur un iPhone physique, et l'app Expo Go de
  l'App Store iOS est restée en **54.0.2 (SDK 54 uniquement)** — les SDK 55/56 n'y sont pas
  disponibles (vérifié juin 2026 : un projet SDK 56 affiche « Project is incompatible with
  this version of Expo Go » sans mise à jour possible). Avant tout bump de SDK, vérifier la
  version réellement publiée sur https://apps.apple.com/app/expo-go/id982107779.
- **expo-router v6** — file-based routing, basé sur react-navigation : `Stack` et `Tabs`
  s'importent depuis `'expo-router'`, et `ThemeProvider`/`DarkTheme`/`DefaultTheme` depuis
  `'@react-navigation/native'`. (Au SDK 56, le router se découple de react-navigation et les
  imports changent — points à revoir le jour du bump.)
- **Styling : StyleSheet + design tokens** (`src/constants/theme.ts`). Pas de NativeWind —
  choix délibéré pour limiter les couches fragiles au-dessus de Metro/Babel.
- **Zustand 5** + AsyncStorage (persistance) pour l'état global.
- **lucide-react-native** pour les icônes (jamais `lucide-react`, DOM-only).
- **expo-image** pour les images, **expo-image-picker** pour les photos du wizard.
- React Compiler (expérimental) et typed routes activés (`app.json > experiments`).

## Commandes

- `npm install` — dépendances.
- `npx expo start` — serveur Metro. `w` pour le web, ou scanner le QR avec **Expo Go** sur
  iPhone (pas de simulateur Xcode sur Windows).
- `npx tsc --noEmit` — type-check (à lancer avant de conclure une modif).
- `npx expo export --platform web` — build web de prod ; c'est aussi le **smoke test** de
  référence : si toutes les routes se bundlent, le pipeline est sain.
- `npx expo-doctor` — validation de la config Expo.

Pas de tests unitaires ni de linter au-delà d'`eslint-config-expo` pour l'instant.

## Architecture (`src/`)

```
src/app/                    Routes expo-router
  _layout.tsx               Stack racine (thème nav + déclaration des routes, modal booking)
  (tabs)/_layout.tsx        5 onglets : Accueil, Messages, Réserver (bouton central logo),
                            Réservations, Profil
  (tabs)/{index,chats,reserver,reservations,profil}.tsx
  booking/[service].tsx     Wizard de réservation multi-étapes (modal)
  chat/[id].tsx             Conversation (messages, devis acceptables, documents)
  reservation/[id].tsx      Détail réservation (timeline de statut, annulation)
  profile/{addresses,payments,help}.tsx
src/components/             Composants métier (booking-card, provider-row, service-card…)
  booking/                  Étapes du wizard (question, details, address, schedule, review)
  chat/                     message-bubble (texte / devis / document / système)
  ui/                       Primitives (button, card, chip, badge, avatar, screen…)
src/lib/
  types.ts                  Types du domaine = futurs contrats d'API
  services.ts               Catalogue des services + questions du wizard (config-driven :
                            ajouter un service = ajouter une entrée ici)
  store.ts                  Store Zustand persisté : réservations, conversations, messages,
                            user. Les réponses prestataires sont simulées par setTimeout —
                            c'est le point d'entrée du futur backend temps réel.
  mock-data.ts              Données de démo (prestataires montréalais, seed réservations)
  format.ts                 Formatage fr-CA (prix CAD, dates)
  booking-status.ts         Libellés/tons des statuts de réservation
src/constants/theme.ts      Design tokens (couleurs light/dark, spacing, radius, fontsize)
src/hooks/use-theme.ts      Accès au thème selon le color scheme
```

**Alias** : `@/*` → `./src/*`, `@/assets/*` → `./assets/*` (tsconfig.json).

## Typage (priorité absolue)

Le typage strict est une exigence forte de Tristan. Le projet compile avec `strict`,
`noUncheckedIndexedAccess`, `noUnusedLocals` et `noUnusedParameters` :

- **Jamais de `any`**, jamais de `as` pour faire taire le compilateur, jamais de `!`
  (non-null assertion) — prouver l'existence avec une garde (`if (!x) return/throw`).
- Tous les types du domaine vivent dans `src/lib/types.ts` — c'est la source de vérité,
  et le futur contrat d'API du backend. Pas de types métier redéfinis dans les écrans.
- Un accès indexé (`array[i]`, `record[key]`) retourne `T | undefined` : toujours gérer le
  cas `undefined` explicitement.
- `npx tsc --noEmit` doit passer à zéro erreur avant de conclure toute modification.

## Règles anti-dérive (importantes)

Tristan a déjà perdu le contrôle de projets précédents à cause de fichiers devenus énormes.
Ces règles sont non négociables :

- **Maximum ~300 lignes par fichier.** Un fichier qui dépasse doit être découpé *dans la
  même PR* (extraire des composants, déplacer la logique dans `lib/`). Le wizard de
  réservation montre le pattern : un orchestrateur + une étape par fichier dans
  `components/booking/`.
- **Les écrans (`src/app/`) composent, ils ne calculent pas.** Toute logique métier
  (filtrage, formatage, règles) vit dans `src/lib/` ou descend dans un composant dédié.
- **Chercher avant de créer.** Vérifier `components/ui/` et `components/` avant d'écrire un
  nouveau composant ; ne jamais dupliquer un bloc d'UI existant.
- **Pas de nouvelle dépendance sans justification** écrite dans ce fichier.
- **Après chaque série de modifications** : `npx tsc --noEmit` doit passer, et l'arbre des
  fichiers doit rester explicable en une phrase par dossier.

## Conventions

- UI 100 % en français (Québec) ; montants en CAD via `lib/format.ts` (`Intl`, locale fr-CA).
- Couleur de marque : `#2563EB` (clair) / `#3B82F6` (sombre) — toujours passer par
  `useTheme()`, jamais de couleurs en dur dans les écrans (exception : avatars et logo).
- Chaque composant : styles statiques dans `StyleSheet.create`, couleurs dynamiques inline
  depuis `useTheme()`.
- Sélecteurs Zustand : ne jamais retourner un objet/tableau neuf dans le sélecteur
  (boucle de re-render avec Zustand v5) — sélectionner le tableau brut et filtrer en
  `useMemo` dans le composant.
- Flux principal de l'app : demande (wizard) → réservation `pending` + conversation créée →
  devis du prestataire dans le chat → acceptation → réservation `confirmed`.

## Données mock / démo

Tout l'état vient de `lib/mock-data.ts` (seed) et vit dans le store persisté
(`tocato-store-v1` dans AsyncStorage). « Profil → Réinitialiser la démo » restaure le seed.
Les dates du seed sont relatives à aujourd'hui pour que la démo reste crédible.

## Notes

- Identité git du repo : `tristan-dev1 <2534117@etu.cchic.ca>` (compte GitHub réel :
  `tristan-devos`). Laisser tel quel.
- L'ancien prototype web (export Figma Make) a été entièrement supprimé en juin 2026 —
  l'historique git le conserve si besoin.
