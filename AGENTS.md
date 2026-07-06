# TOCATO — guide du repo

Application mobile (côté client) de mise en relation entre clients et prestataires de services
à domicile. Marché de lancement : **Montréal, QC**. L'interface est **bilingue français/anglais**
(i18n), **français par défaut** (Québec) — voir la section i18n. Services au lancement :
plombier, déménageur, jardinier.

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
- **expo-web-browser** pour le login social (OAuth Google). Dépendance ajoutée, justifiée :
  le flux OAuth via navigateur (`signInWithOAuth` + `openAuthSessionAsync`) est la seule
  voie **compatible Expo Go** (les boutons natifs `expo-apple-authentication` /
  google-signin imposeraient un dev build et l'abandon d'Expo Go). `expo-linking` (déjà
  présent) fournit le redirect deep link. Détails en section Login social.
- **i18n bilingue FR/EN** — `i18next` + `react-i18next` + `expo-localization`. Trois
  dépendances ajoutées, **justifiées** : l'UI bilingue (français par défaut, anglais
  disponible) est un choix produit assumé pour un marché montréalais, et ce sont les
  briques standard de l'i18n React Native — `expo-localization` détecte la langue de
  l'appareil, `i18next`/`react-i18next` portent le catalogue et le hook `useTranslation`.
  Détails en section i18n.
- **Supabase** comme backend (auth email/mot de passe **et OAuth Google**, Postgres + RLS,
  Realtime). Deux
  dépendances ajoutées, justifiées : `@supabase/supabase-js` (client officiel) et
  `react-native-url-polyfill` (fournit `URL`/`URLSearchParams` que Hermes n'expose pas
  complètement, requis par supabase-js sous React Native). État de la migration :
  **migration store terminée** : auth, profil/adresses, et bookings/conversations/messages
  passent tous par Supabase (lectures + Realtime + écritures). La simulation des réponses
  prestataire vit désormais côté serveur (Edge Function `provider-reply` + service_role +
  Realtime) ; l'app ne fait que la déclencher. Flux multi-prestataires : la demande est
  créée sans prestataire, chaque prestataire intéressé ouvre sa conversation (côté
  serveur), et l'acceptation d'un devis fixe le prestataire. Les photos du wizard sont téléversées dans
  **Supabase Storage** (bucket privé `booking-photos`, RLS par dossier `{user}/{booking}/`,
  affichées via URLs signées) — la migration store est désormais complète.
- React Compiler (expérimental) et typed routes activés (`app.json > experiments`).

## Commandes

- `npm install` — dépendances.
- `npx expo start` — serveur Metro. `w` pour le web, ou scanner le QR avec **Expo Go** sur
  iPhone (pas de simulateur Xcode sur Windows).
- `npx tsc --noEmit` — type-check (à lancer avant de conclure une modif).
- `npx expo export --platform web` — build web de prod ; c'est aussi le **smoke test** de
  référence : si toutes les routes se bundlent, le pipeline est sain.
- `npx expo-doctor` — validation de la config Expo.
- **Supabase** : copier `.env.example` en `.env` et remplir `EXPO_PUBLIC_SUPABASE_URL` /
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Dashboard > Project Settings > API). Exécuter
  `supabase/schema.sql` puis `supabase/rpc.sql` dans le SQL editor (tables + RLS + Realtime +
  seed, puis fonctions/triggers ; les deux idempotents et ré-exécutables).
  Types DB régénérables via `npx supabase gen types typescript --project-id <ref>`
  (réimporter ensuite les unions de `lib/types.ts` dans `lib/database.types.ts`).
- **Edge Functions** : `supabase functions deploy provider-reply --project-ref <ref>`
  (déploiement seul, sans Docker ; `supabase login` requis). `SUPABASE_URL` /
  `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement.

Pas de tests unitaires ni de linter au-delà d'`eslint-config-expo` pour l'instant.

## Déploiement (EAS Update)

Le projet **est déjà déployé** et se met à jour par **EAS Update (OTA, JS seulement)** —
pas de build natif pour l'instant, et **pas de `eas.json`** à la racine.

- **Projet EAS** : organisation `tocato`, slug `tocato`, projectId
  `83c31465-c53d-4aac-b3be-615809d04420` (voir `app.json > owner`, `extra.eas`, `updates.url`).
  Dashboard : https://expo.dev/accounts/tocato/projects/tocato
- **Compte** : `tristanos` (propriétaire de l'org `tocato`). Vérifier avec
  `npx eas-cli whoami` (le binaire s'appelle `eas-cli`, **pas** `eas`).
- **Une seule branche : `preview`**, runtime `exposdk:54.0.0`. **Aucun channel** : l'app
  consomme les updates **directement par branche**, et comme le runtime est `exposdk:54.0.0`
  l'update s'ouvre dans **Expo Go SDK 54** (cohérent avec le workflow iPhone).
- **Publier le code committé** (= « déployer sur Expo ») :
  `npx eas-cli update --branch preview --message "<résumé>"`. Pas `--non-interactive`
  (non supporté ici) ; utiliser `$CI=1` si besoin. L'iPhone récupère l'update au prochain
  lancement d'Expo Go (fermer/rouvrir l'app).
- **Avant tout build natif** (TestFlight, APK) il faudra d'abord créer un `eas.json`.
- Rappel : un changement de **config Supabase** (ex. « Confirm email ») est côté serveur et
  s'applique **sans redéploiement**.

## Architecture (`src/`)

```
src/app/                    Routes expo-router
  _layout.tsx               Stack racine (thème nav + routes, modal booking, garde auth)
  +not-found.tsx            Écran 404 (EmptyState, retour vers les onglets)
  (auth)/_layout.tsx        Stack des écrans d'auth (sans header)
  (auth)/{login,signup}.tsx Connexion / inscription (email + mot de passe, + Google OAuth)
  (tabs)/_layout.tsx        5 onglets : Accueil, Réservations, Réserver (bouton central
                            logo), Messages, Profil
  (tabs)/{index,chats,reserver,reservations,profil}.tsx
  booking/[service].tsx     Wizard de réservation multi-étapes (modal)
  chat/[id].tsx             Conversation (messages, devis acceptables, documents ;
                            header cliquable vers le profil du prestataire)
  reservation/[id].tsx      Détail réservation (timeline de statut, offres reçues ou
                            prestataire confirmé, annulation)
  provider/[id].tsx         Profil public d'un prestataire (fiche, stats, services)
  profile/{addresses,payments,help}.tsx
src/components/             Composants métier (booking-card, provider-row, service-card…)
  auth/                     auth-text-field (champ libellé des formulaires de connexion)
                            + social-auth (séparateur « ou » + bouton Google, OAuth navigateur)
  booking/                  Étapes du wizard (question, details, address, schedule, review)
                            + booking-photos (galerie des photos d'une réservation, URLs signées)
                            + booking-success (écran de confirmation post-envoi — les
                            prestataires contacteront le client dans Messages)
  reservation/              status-timeline (frise verticale de progression d'une réservation)
                            + provider-offers (offres reçues sur une demande ouverte :
                            une carte par prestataire intéressé, tap = ouvrir le chat)
  chat/                     message-bubble (texte / devis / document / système)
  ui/                       Primitives (button, card, chip, badge, avatar, screen…)
src/lib/
  types.ts                  Types du domaine = futurs contrats d'API
  services.ts               Catalogue des services + questions du wizard (config-driven :
                            ajouter un service = ajouter une entrée ici). Les libellés
                            affichés sont traduits via use-localized-service (clés i18n).
  use-localized-service.ts  Hook : renvoie un ServiceDefinition entièrement traduit (nom,
                            tagline, questions, options) selon la langue active.
  store.ts                  Store Zustand adossé à Supabase : réservations, conversations,
                            messages. Charge à la connexion (loadAll), écoute le Realtime,
                            réécrit via Supabase (inserts/updates directs, RLS). Accepter
                            un devis fixe le prestataire et notifie les autres conversations.
  profile-store.ts          Profil + adresses de l'utilisateur connecté, adossé à Supabase
                            (chargé à la connexion). A remplacé le `user` mock du store.
  db-mappers.ts             Conversion lignes Supabase -> types du domaine (frontière DB/app)
  photo-upload.ts           Upload des photos du wizard vers Storage (bucket privé
                            booking-photos) + URLs signées pour l'affichage. Décodage base64
                            inline (pas de dépendance ajoutée).
  provider-reply.ts         Déclenche la simulation prestataire côté serveur (invoke de
                            l'Edge Function provider-reply) — fire-and-forget, Realtime.
                            `initial` (bookingId) : les prestataires du service viennent
                            vers le client ; `canned` (conversationId) : réponse au chat.
  mock-data.ts              Catalogue de prestataires de démo (montréalais) — seul mock
                            restant. Fiches affichées côté client (conversations, offres,
                            profil prestataire). Ses IDs doivent refléter les prestataires
                            seedés dans schema.sql (provider_id des conversations et
                            réservations). Le reste vit dans Supabase.
  format.ts                 createFormatters(locale) : formatage fr-CA / en-CA (prix CAD,
                            dates). Consommé via le hook use-formats (langue active).
  booking-status.ts         Libellés/tons des statuts de réservation
  supabase.ts               Client Supabase (auth/DB/realtime) ; `isSupabaseConfigured`
                            reste false tant que .env est vide (app fonctionnelle sans).
                            flowType 'pkce' (échange de code OAuth), detectSessionInUrl false.
  database.types.ts         Type `Database` du schéma Postgres, aligné sur types.ts
  auth-store.ts             Store Zustand auth (signUp/signIn/signInWithOAuth/signOut,
                            session), séparé du store applicatif ; `initAuth()` au montage.
                            signInWithOAuth : flux navigateur (expo-web-browser) + échange
                            du code sur le deep link (Linking.createURL('auth-callback')).
src/i18n/index.ts           Init i18next (FR/EN) : langue par défaut = langue de l'appareil
                            (fallback fr), persistance AsyncStorage (`tocato-language`),
                            loadSavedLanguage()/changeLanguage(). Monté dans app/_layout.tsx.
src/locales/{fr,en}.ts      Catalogues de traduction (source de vérité des textes UI).
                            Dépassent volontairement le plafond 300 lignes (voir anti-dérive).
src/constants/theme.ts      Design tokens (couleurs light/dark, spacing, radius, fontsize)
src/hooks/use-color-scheme.ts  Color scheme actif (variante .web.ts pour le rendu web)
src/hooks/use-theme.ts      Accès au thème selon le color scheme
src/hooks/use-formats.ts    Formatters (prix/dates) liés à la langue active (fr-CA / en-CA)
src/hooks/use-auth-guard.ts Redirige login <-> app selon la session (inactif sans Supabase)
supabase/schema.sql         Schéma Postgres : tables + RLS + Realtime + bucket Storage
                            booking-photos (privé, RLS owner-only) + seed prestataires
                            (idempotent, ré-exécutable). Miroir de lib/types.ts. Les IDs
                            prestataires doivent rester synchrones avec lib/mock-data.ts.
supabase/rpc.sql            Fonctions/triggers (seed_demo, trigger messages ; drop de
                            l'ancienne RPC create_booking) — à exécuter APRÈS schema.sql.
                            seed_demo charge le scénario de démo (réservations/
                            conversations/messages, dates relatives, multi-offres).
supabase/functions/         Edge Functions (Deno). provider-reply : simulation côté
                            serveur (service_role) — `initial` crée une conversation par
                            prestataire du service (intro + devis, délais échelonnés),
                            `canned` répond dans une conversation. Exclu du tsconfig.
```

**Alias** : `@/*` → `./src/*`, `@/assets/*` → `./assets/*` (tsconfig.json).

## i18n (bilingue FR/EN)

L'UI est bilingue, **français par défaut**. Choix produit assumé (marché montréalais), d'où
les dépendances `i18next` / `react-i18next` / `expo-localization`.

- **Source de vérité des textes** : `src/locales/fr.ts` et `src/locales/en.ts`. Tout texte
  affiché passe par une clé i18n — **jamais de chaîne UI en dur dans un écran ou composant**.
  Les deux catalogues doivent rester **structurellement identiques** (mêmes clés).
- **Accès** : hook `useTranslation()` (`const { t } = useTranslation()`), puis `t('cle.sous-cle')`.
- **Catalogue de services** : ne pas dupliquer les libellés dans `services.ts` ; passer par
  `useLocalizedService(id)` qui résout nom/tagline/questions/options via les clés i18n.
- **Formatage** : utiliser le hook `useFormats()` (prix CAD, dates), pas `format.ts`
  directement, pour que la locale suive la langue active (fr-CA / en-CA).
- **Langue** : détectée depuis l'appareil au premier lancement, surchargée et persistée via
  le sélecteur dans `profil.tsx` (`changeLanguage`), restaurée par `loadSavedLanguage()`.
- **Ajouter un texte** : ajouter la clé dans `fr.ts` **et** `en.ts` (sinon fallback FR).

## Login social (OAuth Google)

Login via **navigateur** (pas de boutons natifs), seul flux compatible **Expo Go**. Le code
est dans `auth-store.signInWithOAuth` + `components/auth/social-auth.tsx`. Côté UI : bouton
« Continuer avec Google » sur les écrans login **et** signup.

Le code seul ne suffit pas : il faut une **config console** (non versionnable, à faire une
fois). Checklist :

1. **Google Cloud Console** → API & Services → Credentials → *OAuth client ID* (type
   *Web application*). Dans *Authorized redirect URIs*, ajouter l'URL de callback Supabase :
   `https://<ref>.supabase.co/auth/v1/callback`. Récupérer *Client ID* et *Client secret*.
2. **Supabase Dashboard** → Authentication → Providers → **Google** : activer, coller
   Client ID + secret.
3. **Supabase Dashboard** → Authentication → URL Configuration → *Redirect URLs* : ajouter
   `tocato://**` (build standalone) **et** `exp://**` (Expo Go). Le deep link de retour est
   `Linking.createURL('auth-callback')`.
4. **Piège vérifié (Expo Go)** : Supabase **ne matche pas** les schemes custom `exp://`
   dans l'allowlist *Redirect URLs* — le `redirect_to` est alors **ignoré** et il retombe
   sur la **Site URL** (par défaut `http://localhost:3000`, d'où la page blanche). En dev,
   mettre la **Site URL** au deep link Expo Go exact, ex. `exp://192.168.1.4:8081/--/auth-callback`
   (l'IP/port viennent de Metro ; un `console.log(Linking.createURL('auth-callback'))` la
   donne). En build standalone, le scheme `tocato://` est matché normalement par l'allowlist,
   donc la Site URL peut rester une vraie URL https.

Le profil est créé par le trigger `handle_new_user` (schema.sql), qui lit `name` /
`full_name` des métadonnées Google. **Ré-exécuter `schema.sql`** après ce changement de
trigger. Tant que l'étape 1-2 n'est pas faite, le bouton renvoie une erreur Supabase.

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
  - **Seule exception : les catalogues de traduction** (`src/locales/fr.ts`, `en.ts`).
    Ce sont des données plates (clé → texte), sans logique, et les découper fragmenterait
    la source de vérité des textes sans gain de lisibilité. Exception **exceptionnelle et
    nécessaire**, réservée aux catalogues i18n — elle ne s'étend à aucun fichier de code.
- **Les écrans (`src/app/`) composent, ils ne calculent pas.** Toute logique métier
  (filtrage, formatage, règles) vit dans `src/lib/` ou descend dans un composant dédié.
- **Chercher avant de créer.** Vérifier `components/ui/` et `components/` avant d'écrire un
  nouveau composant ; ne jamais dupliquer un bloc d'UI existant.
- **Pas de nouvelle dépendance sans justification** écrite dans ce fichier.
- **Après chaque série de modifications** : `npx tsc --noEmit` doit passer, et l'arbre des
  fichiers doit rester explicable en une phrase par dossier.

## Conventions

- UI bilingue FR/EN, **français par défaut** (Québec) : textes via clés i18n (`useTranslation`),
  jamais de chaîne en dur (voir section i18n). Montants en CAD et dates via `useFormats()`
  (locale liée à la langue active : fr-CA / en-CA).
- Couleur de marque : `#1C6B3E` (clair) / `#3AB869` (sombre) — toujours passer par
  `useTheme()`, jamais de couleurs en dur dans les écrans (exception : avatars et logo).
- Chaque composant : styles statiques dans `StyleSheet.create`, couleurs dynamiques inline
  depuis `useTheme()`.
- Sélecteurs Zustand : ne jamais retourner un objet/tableau neuf dans le sélecteur
  (boucle de re-render avec Zustand v5) — sélectionner le tableau brut et filtrer en
  `useMemo` dans le composant.
- Flux principal de l'app : demande (wizard, sans choix de prestataire) → réservation
  `pending` sans prestataire → les prestataires intéressés ouvrent chacun une conversation
  avec un devis (autant d'offres que de prestataires tant que rien n'est accepté) →
  acceptation d'un devis → réservation `confirmed` avec ce prestataire (les autres
  conversations sont notifiées et leurs devis retirés).

## Données de démo

L'état applicatif (réservations, conversations, messages) vit dans **Supabase** — le store
n'est **pas** persisté en AsyncStorage. Le seul mock restant est le **catalogue de
prestataires** (`lib/mock-data.ts`) : les fiches affichées côté client (conversations,
offres reçues, profil prestataire). Les prestataires « répondent » aux demandes via
l'Edge Function `provider-reply` (une conversation par prestataire du service, table
`providers`). Les IDs du mock doivent refléter les prestataires seedés dans
`supabase/schema.sql` (FK `provider_id` des conversations et réservations).

« Profil → Réinitialiser la démo » appelle la RPC **`seed_demo`** (côté serveur, dans
`supabase/rpc.sql`) puis recharge depuis Supabase. C'est `seed_demo` qui contient le scénario
de démo (réservations/conversations/messages), avec des dates relatives à aujourd'hui pour
que la démo reste crédible.

## Notes

- Identité git : `tristan-devos <tristan2003devos@gmail.com>` (config globale, compte GitHub
  `tristan-devos`). Les commits antérieurs à juin 2026 portent l'ancienne identité
  `tristan-dev1 <2534117@etu.cchic.ca>` ; ne pas réécrire l'historique.
- **Branche `main` protégée** (côté GitHub) : push direct interdit — tout passe par une PR
  (mergeable par soi-même, aucune review requise) ; force-push et suppression bloqués ;
  résolution des conversations requise ; règle appliquée aux admins. Flux : brancher
  (`feat/...`), pousser, `gh pr create`, puis merger. Réglage modifiable dans
  *Settings → Branches* ou via `gh api repos/tristan-devos/TOCATO/branches/main/protection`.
- L'ancien prototype web (export Figma Make) a été entièrement supprimé en juin 2026 —
  l'historique git le conserve si besoin.
