# TOCATO : guide du repo

Application mobile (côté client) de mise en relation entre clients et prestataires de services
à domicile. Marché de lancement : **Montréal, QC**. L'interface est **bilingue français/anglais**
(i18n), **français par défaut** (Québec) : voir la section i18n. Services au lancement :
plombier, déménageur, jardinier.

> Expo évolue vite : avant toute modification non triviale, lire les docs versionnées
> https://docs.expo.dev/versions/v57.0.0/ (ou https://docs.expo.dev/llms-full.txt).

## Stack

- **Expo SDK 57** (React Native 0.86, React 19.2). **Pin volontaire : ne pas bumper.**
  L'app se teste via **Expo Go** sur iPhone physique (le collègue au Canada) ; le dev se
  fait sous Linux (Fedora), sans simulateur iOS. Avant tout futur bump
  de SDK, vérifier que la version publiée de l'app Expo Go supporte bien la nouvelle
  version sur https://apps.apple.com/app/expo-go/id982107779 (SDK 54 posait ce problème :
  Expo Go iOS était resté bloqué en 54.0.2, incompatible avec les projets SDK 55/56 : la
  mise à jour vers 57 a confirmé qu'Expo Go supporte de nouveau la dernière version).
- **expo-router** (version alignée sur le SDK, `~57.0.22`) : file-based routing. Depuis le
  **SDK 56**, le router s'est découplé
  de react-navigation : imports interdits depuis `@react-navigation/*` en code applicatif.
  `Stack`/`Tabs` s'importent depuis `'expo-router'`, `ThemeProvider`/`DarkTheme`/
  `DefaultTheme` depuis `'expo-router/react-navigation'` (plus depuis
  `'@react-navigation/native'`, retiré des dépendances). Voir
  https://docs.expo.dev/router/migrate/sdk-55-to-56/ pour la table de correspondance
  complète des imports si d'autres écrans venaient à en avoir besoin.
- **Styling : StyleSheet + design tokens** (`src/constants/theme.ts`). Pas de NativeWind :
  choix délibéré pour limiter les couches fragiles au-dessus de Metro/Babel.
- **Police : Plus Jakarta Sans** (`@expo-google-fonts/plus-jakarta-sans` + `expo-font`).
  Deux dépendances ajoutées, justifiées : la typographie porte l'essentiel de la
  personnalité de l'app (`docs/experience-emotionnelle.md`), et la police système ne
  distingue pas TOCATO. Chargée au runtime par `useFonts` (compatible Expo Go, pas de
  build natif). `expo-font` était déjà présent en transitif via `expo`, déclaré pour
  l'import direct.
- **Mouvement et toucher** : `react-native-reanimated` (déjà présent) pour la contraction
  au toucher, les entrées de liste et les squelettes ; `expo-haptics` via `lib/haptics.ts`.
- **Zustand 5** + AsyncStorage (persistance) pour l'état global.
- **lucide-react-native** pour les icônes (jamais `lucide-react`, DOM-only).
- **expo-image** pour les images, **expo-image-picker** pour les photos du wizard.
- **expo-web-browser** pour le login social (OAuth Google). Dépendance ajoutée, justifiée :
  le flux OAuth via navigateur (`signInWithOAuth` + `openAuthSessionAsync`) est la seule
  voie **compatible Expo Go** (les boutons natifs `expo-apple-authentication` /
  google-signin imposeraient un dev build et l'abandon d'Expo Go). `expo-linking` (déjà
  présent) fournit le redirect deep link. Détails en section Login social.
- **i18n bilingue FR/EN** : `i18next` + `react-i18next` + `expo-localization`. Trois
  dépendances ajoutées, **justifiées** : l'UI bilingue (français par défaut, anglais
  disponible) est un choix produit assumé pour un marché montréalais, et ce sont les
  briques standard de l'i18n React Native : `expo-localization` détecte la langue de
  l'appareil, `i18next`/`react-i18next` portent le catalogue et le hook `useTranslation`.
  Détails en section i18n.
- **Supabase** comme backend (auth email/mot de passe **et OAuth Google**, Postgres + RLS,
  Realtime). Deux
  dépendances ajoutées, justifiées : `@supabase/supabase-js` (client officiel) et
  `react-native-url-polyfill` (fournit `URL`/`URLSearchParams` que Hermes n'expose pas
  complètement, requis par supabase-js sous React Native). **`expo-crypto`** ajouté,
  justifié : Hermes n'expose pas WebCrypto, donc supabase-js dégradait le PKCE
  (`code_verifier` via `Math.random()`, méthode `plain`). `src/lib/crypto-polyfill.ts`
  fournit `crypto.getRandomValues` + `crypto.subtle.digest` sur natif (compatible Expo
  Go), importé en tête de `src/lib/supabase.ts`. État de la migration :
  **migration store terminée** : auth, profil/adresses, et bookings/conversations/messages
  passent tous par Supabase (lectures + Realtime + écritures). Plus de simulation : les
  devis viennent de vrais comptes prestataires (lot 5, voir Données de test). Les photos du wizard sont téléversées dans
  **Supabase Storage** (bucket privé `booking-photos`, RLS par dossier `{user}/{booking}/`,
  affichées via URLs signées) : la migration store est désormais complète.
- React Compiler (expérimental) et typed routes activés (`app.json > experiments`).
  **Piège vérifié** : après l'ajout d'une route, `tsc` refuse `router.replace('/nouvelle')`
  tant que `.expo/types/router.d.ts` n'est pas régénéré ; `npx expo export` ne le fait pas,
  `npx expo start` si (quelques secondes suffisent, puis Ctrl+C).

## Commandes

- `npm install` : dépendances.
- `npx expo start` : serveur Metro. `w` pour le web, ou scanner le QR avec **Expo Go** sur
  iPhone (pas de simulateur Xcode hors macOS). Après une modif de `.env` : `npx expo start -c`
  (Metro inline les `EXPO_PUBLIC_*` au bundle, le cache garderait l'ancienne valeur).
- `npx tsc --noEmit` : type-check (à lancer avant de conclure une modif).
- `npx expo export --platform web` : build web de prod ; c'est aussi le **smoke test** de
  référence : si toutes les routes se bundlent, le pipeline est sain.
- `npx expo-doctor` : validation de la config Expo ; doit passer (21/21). Si des paquets
  sont signalés en retard de patch : `npx expo install --fix` (reste dans le SDK pinné,
  runtime EAS inchangé), puis relancer tsc + export web.
- **Supabase** : copier `.env.example` en `.env` et remplir `EXPO_PUBLIC_SUPABASE_URL` /
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Dashboard > Project Settings > API).
  **Piège vérifié** : l'URL est celle de l'**API**, `https://<ref>.supabase.co`, **pas**
  l'URL du dashboard (`https://supabase.com/dashboard/project/<ref>`). Avec l'URL du
  dashboard, Supabase répond du HTML et l'app affiche `JSON parse error: Unexpected
  character: <` à l'inscription/connexion. Vérif rapide :
  `curl https://<ref>.supabase.co/auth/v1/health` doit répondre du **JSON** (401 sans clé).
  **Appliquer le SQL** : `supabase/apply.sh` (depuis `main` à jour), qui joue dans cet
  ordre : `supabase/schema.sql` (tables,
  migrations, Realtime, Storage) → `rpc.sql` (trigger, create_booking) →
  `transitions.sql` (transitions côté client) → `providers.sql` (comptes et actions
  prestataire) → `applications.sql` (adhésion des prestataires, registre RBQ) →
  `photos.sql` (photos des prestataires) → `admin.sql` (actions de l'admin) →
  `policies.sql` (RLS + Storage, **en dernier** : les policies appellent
  les fonctions des fichiers précédents). Tous idempotents et ré-exécutables. **Après
  toute PR qui touche `supabase/`** : `git checkout main && git pull && supabase/apply.sh`.
  Le script remplace le copier-coller dans le SQL editor : psql via Docker (image
  `postgres:16-alpine`, rien à installer), les huit fichiers dans **une seule
  transaction** (à la première erreur, rien n'est appliqué), confirmation `[o/N]` après
  affichage de l'hôte visé. Il **refuse** de tourner hors de `main`, avec des
  modifications dans `supabase/`, ou si `main` n'est pas à jour avec `origin/main`.
  Connexion : `SUPABASE_DB_URL` dans `.env` = Dashboard → **Connect** → **Session
  pooler** (`postgresql://postgres.<ref>:<mot de passe>@aws-…pooler.supabase.com:5432/postgres`).
  **Pas** la *Direct connection* (IPv6 seulement, injoignable depuis la plupart des
  réseaux) ni le *Transaction pooler* (port 6543). Mot de passe perdu : Project
  Settings → Database → *Reset database password* (caractères spéciaux du mot de passe
  à encoder dans l'URL, ex. `@` → `%40`). Sans préfixe `EXPO_PUBLIC_`, Metro
  ne l'inclut jamais dans le bundle. Le SQL editor reste possible (mêmes fichiers, même
  ordre) si Docker n'est pas disponible.
  **Règle : la base Supabase partagée reflète toujours `main`.** Ne jamais y exécuter le
  SQL d'une branche non mergée (tester avec `supabase/tests/run.sh`). **Piège vérifié** : le
  SQL de la PR #8 (jamais mergée) y avait été exécuté et avait supprimé
  `bookings.conversation_id` ; `seed_demo` / `create_booking` échouaient alors en silence
  (« Réinitialiser la démo » ne montrait rien). Réparé par `schema.sql`. Réservations
  orphelines laissées par cette époque (sans conversation ni prestataire, inutilisables par
  l'app) : `select id, user_id from bookings where conversation_id is null or provider_id
  is null;` : à supprimer à la main si besoin, puis ré-exécuter `schema.sql` pour remettre
  les `NOT NULL` (réparation remplacée depuis par la migration vers l'appel d'offres,
  qui supprime `conversation_id` proprement).
  Types DB régénérables via `npx supabase gen types typescript --project-id <ref>`
  (réimporter ensuite les unions de `lib/types.ts` dans `lib/database.types.ts`).
- **Registre RBQ** (vérification des licences de plomberie, `docs/adhesion-prestataires.md`
  §6) : `supabase/rbq-import.sh` remplace `rbq_licences` par les licences d'entrepreneur
  actives publiées par la RBQ (Données Québec, CC-BY 4.0, environ 53 000 licences dont
  2 300 en plomberie 15.5 ; une minute environ). Tout ou rien, et refus si moins de 20 000
  licences lues (téléchargement tronqué). **Chaque nuit** via la GitHub Action
  `.github/workflows/rbq-import.yml` (8 h UTC) ; à la main : `supabase/rbq-import.sh`
  (lit `SUPABASE_DB_URL` dans `.env`) ou bouton *Run workflow* dans l'onglet Actions.
  **Secret requis** : `SUPABASE_DB_URL` dans *Settings → Secrets and variables → Actions*
  (même chaîne que le `.env`). Sans lui, l'Action échoue (« SUPABASE_DB_URL manquante ») et
  GitHub envoie un courriel. Repo privé : environ 2 min d'Actions par jour, largement dans
  le quota gratuit.
- **Tests SQL** : `supabase/tests/run.sh` (Docker requis, ne touche pas au projet réel).
  Joue les huit fichiers dans un Postgres jetable (install neuve + ré-exécution + mise à
  jour depuis `main`), puis les scénarios RLS/RPC de `supabase/tests/scenarios.sql`
  (client), `scenarios-provider.sql` (prestataire), `scenarios-applications.sql`
  (adhésion) et `scenarios-photos.sql` (photos) : chaque bloc annonce le résultat
  attendu ; le script échoue à la moindre erreur SQL d'installation. **À lancer avant de conclure toute modif SQL** ;
  ajouter un scénario pour chaque nouvelle policy ou RPC.
- **Edge Functions** : une seule, `purge-documents` (Loi 25) : efface la pièce d'identité
  d'une demande d'adhésion 30 jours après la décision, la photo d'une demande refusée
  après le même délai, et les fichiers orphelins (plus de 24 h) des buckets
  `provider-documents` et `provider-photos` (photo remplacée, proposition refusée…).
  Version avec les photos déployée le 2026-09-24 (vérifiée identique à `main`). Passe par l'API Storage avec la clé service_role
  (injectée) : Supabase interdit de supprimer en SQL dans `storage.objects`, et le fichier
  resterait stocké. Appelée chaque nuit par `.github/workflows/purge-documents.yml` avec la
  clé anon (fonction idempotente, sans paramètre : un appel en trop ne fait rien de plus),
  ce qui demande les **variables** GitHub `SUPABASE_URL` et `SUPABASE_ANON_KEY` (Settings →
  Secrets and variables → Actions → Variables ; valeurs publiques du `.env`).
  Déployer **toujours depuis `main` à jour** :
  `npx supabase functions deploy purge-documents --project-ref <ref>` (`supabase login`
  requis), puis vérifier la version déployée (`supabase functions download … --use-api`
  puis `diff`). Vérifier le typage avant : `docker run --rm -v "$PWD/supabase/functions:/fn:ro"
  -w /fn denoland/deno deno check purge-documents/index.ts`. **Piège vérifié** : une version
  déployée depuis la PR #8, jamais mergée, a tourné en production (ancienne `provider-reply`,
  supprimée au lot 5 de l'interface prestataire).

- `npx expo lint` : ESLint (`eslint-config-expo`, `eslint.config.js`). Avertissements
  existants tolérés (i18n, `use-color-scheme.web.ts`) ; pas de nouvelle erreur.

Pas de tests unitaires pour l'instant.

## Déploiement (EAS Update)

Le projet **est déjà déployé** et se met à jour par **EAS Update (OTA, JS seulement)** :
pas de build natif pour l'instant, et **pas de `eas.json`** à la racine.

- **Projet EAS** : organisation `tocato`, slug `tocato`, projectId
  `83c31465-c53d-4aac-b3be-615809d04420` (voir `app.json > owner`, `extra.eas`, `updates.url`).
  Dashboard : https://expo.dev/accounts/tocato/projects/tocato
- **Compte** : `tristanos` (propriétaire de l'org `tocato`). Vérifier avec
  `npx eas-cli whoami` (le binaire s'appelle `eas-cli`, **pas** `eas`).
- **Lien permanent pour tester dans Expo Go** (n'importe où, sans le Metro de personne) :
  QR code https://qr.expo.dev/eas-update?projectId=83c31465-c53d-4aac-b3be-615809d04420&runtimeVersion=exposdk:57.0.0&channel=preview
  (s'ouvre dans un navigateur ; il encode
  `exp://u.expo.dev/83c31465-c53d-4aac-b3be-615809d04420?runtime-version=exposdk%3A57.0.0&channel-name=preview`).
  Scanner avec l'appareil photo de l'iPhone (Expo Go installé) ; ensuite le projet reste
  dans « Recently opened » d'Expo Go. Il sert **toujours la dernière publication** de la
  branche `preview` (rouvrir Expo Go pour la récupérer). Si le runtime change (bump de
  SDK), `runtimeVersion` change aussi dans ce lien : le mettre à jour ici et dans le README.
- **Canal `preview` → branche `preview`** (créé le 2026-09-23 : `eas channel:create
  preview`). **Piège vérifié** : sans canal, le serveur de mises à jour répond 404 à Expo Go
  (`u.expo.dev` résout par canal, pas par branche) : il n'existait pas de lien stable.
  Vérif rapide : `curl -H "expo-platform: ios" -H "expo-runtime-version: exposdk:57.0.0"
  -H "expo-channel-name: preview" -H "accept: multipart/mixed" https://u.expo.dev/<projectId>`
  doit répondre **200**.
- **Une seule branche : `preview`**, runtime `exposdk:57.0.0` (dérivé automatiquement du SDK
  installé : `runtimeVersion.policy: "sdkVersion"` dans `app.json`, se met donc à jour
  seul à chaque bump de SDK). L'app consomme les updates **par le canal `preview`** (relié
  à la branche du même nom), et le runtime détermine dans quelle version d'**Expo Go**
  l'update s'ouvre (cohérent avec le workflow iPhone tant que le SDK pinné et Expo Go
  restent alignés).
- **Publier le code committé** (= « déployer sur Expo ») :
  `npx eas-cli update --branch preview --environment preview --message "<résumé>"`.
  **Variables d'environnement** : `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  sont **stockées sur EAS** (environnements `preview`, `development` et `production`,
  visibilité plaintext : la clé anon est publique par design). La publication ne dépend
  donc plus du `.env` de la personne qui publie. Vérifier : `npx eas-cli env:list
  --environment preview`. **Piège vérifié** (eas-cli 24.7) : avec l'option
  `--environment`, eas-cli pose `EXPO_NO_DOTENV=1` et **ignore le `.env` local** ; sans
  variables sur EAS, l'app publiée démarre en mode « Supabase non configuré » (pas de
  garde de connexion, déconnexion impossible). Le choix dans le menu interactif, lui,
  garde le `.env`. Si l'URL ou la clé change : `eas env:update` dans les trois
  environnements **et** le `.env` local (utilisé par `npx expo start`).
  Pas `--non-interactive` (non supporté ici) ; utiliser `$CI=1` si besoin. L'iPhone récupère l'update au prochain
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
  (auth)/{login,signup}.tsx Connexion / inscription (email + mot de passe, + Google OAuth).
                            Inscription : « Je cherche un service / Je suis prestataire ».
  (tabs)/_layout.tsx        5 onglets : Accueil, Messages, Réserver (bouton central logo),
                            Réservations, Profil
  (tabs)/{index,chats,reserver,reservations,profil}.tsx
  (provider)/_layout.tsx    5 onglets prestataire : Accueil, Demandes, Mes travaux, Messages,
                            Profil. Un prestataire arrive sur Accueil (garde d'auth).
  (provider)/home.tsx       Tableau de bord : prochaine mission, chiffres clés (à venir,
                            devis en attente, terminé ce mois), calendrier semaine/mois,
                            missions du jour choisi, missions « À planifier » (sans date).
  (provider)/{requests,jobs,messages,account}.tsx
                            Noms distincts de (tabs) : un groupe n'ajoute pas de segment
                            d'URL, deux `index`/`chats` entreraient en conflit. messages
                            ré-exporte (tabs)/chats (rôle géré par use-counterpart).
  apply.tsx                 Demandeur d'adhésion (rôle applicant, seul écran accessible) :
                            formulaire tant que rien n'est envoyé, puis statut (en examen,
                            ou refus avec motif et « Corriger et renvoyer »)
  admin/{index,[id]}.tsx    Admin (is_admin) : liste des adhésions + fraîcheur du registre RBQ
                            + « Photos à valider », détail (vérif RBQ, photo et pièces en
                            URLs signées, approuver / refuser).
  admin/photo/[providerId].tsx  Admin : photo proposée par un prestataire (à côté de
                            l'actuelle), publier ou refuser avec motif.
                            Entrée « Adhésions prestataires » dans le profil si admin.
  request/[id].tsx          Prestataire : demande ouverte (ville + secteur) + formulaire de devis
  job/[id].tsx              Prestataire : mission retenue (adresse exacte, commencer/terminer)
  booking/[service].tsx     Wizard de réservation multi-étapes (modal)
  chat/[id].tsx             Conversation (messages, devis acceptables, documents)
  reservation/[id].tsx      Détail réservation (timeline de statut, offres reçues tant que
                            la demande est ouverte, prestataire retenu, annulation)
  provider/[id].tsx         Profil public d'un prestataire (depuis le chat, le détail
                            réservation, les prestataires populaires de l'accueil)
  profile/{addresses,payments,help}.tsx
src/components/             Composants métier (booking-card, provider-row, service-card…)
  auth/                     social-auth (séparateur « ou » + bouton Google, OAuth navigateur)
  booking/                  Étapes du wizard (question, details, address, schedule,
                            review) : pas de choix de prestataire (appel d'offres)
                            + booking-photos (galerie des photos d'une réservation, URLs signées)
                            + booking-success (célébration post-envoi)
  reservation/              status-timeline (frise verticale de progression d'une réservation)
                            + provider-offers (offres reçues : une offer-card par
                            prestataire intéressé, grande photo, vérifications, montant du
                            devis en attente, tap = conversation)
                            + booking-summary (en-tête service/date/statut) + request-details
                            (réponses, description, photos, lieu, date) : partagés client,
                            demande ouverte et mission prestataire. booking-summary affiche
                            aussi la phrase de statut côté client (hooks/use-status-line).
  celebration/              animated-check (coche SVG dessinée), celebration (écran +
                            CelebrationModal), quote-accepted-celebration. Seulement pour
                            demande envoyée, devis accepté, mission terminée.
  illustrations/            SVG maison aux couleurs du thème (calendar, chat, toolbox, home) :
                            états vides (EmptyState `illustration`) et accueil client.
  home/                     home-hero (accroche + « Décrire mon besoin »), trust-banner (ce
                            que TOCATO vérifie chez chaque prestataire)
  provider/                 request-card (demande ouverte) + quote-form (devis, send_quote)
                            + tableau de bord : next-mission-card, stat-tiles,
                            mission-calendar (+ calendar-day), mission-list
  profile/                  account-actions (Langue + Se déconnecter, profils client et
                            prestataire) + provider-photo-card (« Ma photo » du prestataire :
                            proposer une photo, état en attente / refusée)
  provider-avatar.tsx       Avatar d'un prestataire : sa photo validée (URL signée), sinon
                            ses initiales. À utiliser partout où un prestataire apparaît.
  apply/                    Formulaire d'adhésion : application-form (orchestrateur, 4 étapes)
                            + business-step, legal-step, documents-step (photo + pièces,
                            document-picker, recadrage carré pour la photo),
                            application-review, application-status, step-header
  admin/                    Écran admin : registry-status, application-row, application-
                            status-badge, rbq-check-card, document-image (pièce ou photo),
                            decision-panel (approuver / refuser, adhésion comme photo),
                            photo-change-row
  chat/                     message-bubble (texte / devis / document / système ; les
                            boutons d'un devis n'existent que côté client)
  ui/                       Primitives (button, card, chip, badge, avatar, screen (option
                            refreshControl), text-field, segmented-control…) + pressable-scale (Pressable
                            qui se contracte au toucher : base de Button, Card, Chip),
                            skeleton (Skeleton, ListSkeleton : listes tant que dataReady
                            est faux), fade-in-item (entrée décalée des 8 premiers éléments)
src/lib/
  types.ts                  Types du domaine = futurs contrats d'API
  services.ts               Catalogue des services + questions du wizard (config-driven :
                            ajouter un service = ajouter une entrée ici). Les libellés
                            affichés sont traduits via use-localized-service (clés i18n).
  use-localized-service.ts  Hook : renvoie un ServiceDefinition entièrement traduit (nom,
                            tagline, questions, options) selon la langue active.
  store.ts                  Store Zustand adossé à Supabase : réservations, conversations,
                            messages. Charge à la connexion (loadAll), écoute le Realtime,
                            écrit via RPC (create_booking, accept/decline_quote,
                            cancel_booking…) ; seul l'envoi d'un message texte est un insert.
  profile-store.ts          Profil + adresses + **rôle** de l'utilisateur connecté : provider
                            (RPC current_provider_id), applicant (demande en cours ou refusée,
                            ou intention « Je suis prestataire » pas encore envoyée), sinon
                            client. Chargé EN PREMIER à la connexion : le store en dépend pour
                            savoir qui est « moi ».
  application-store.ts      Demande d'adhésion du compte : chargement, envoi (pièces puis RPC
                            submit_provider_application), Realtime sur sa ligne (la décision
                            de l'admin recharge la session, donc le rôle).
  application-draft.ts      Brouillon du formulaire d'adhésion et règles de validation (mêmes
                            que le serveur).
  signup-intent.ts          Intention « Je suis prestataire » (AsyncStorage) le temps que la
                            demande soit envoyée ; effacée à la déconnexion.
  admin-store.ts            Admin : demandes (RLS ouverte à is_admin), nom/courriel des
                            demandeurs et fraîcheur du registre (RPC admin_*), décisions.
  rbq.ts                    Registre RBQ : âge de la copie (alerte au-delà de 3 jours) et lien
                            de vérification officiel.
  document-upload.ts        Pièces justificatives vers le bucket privé provider-documents +
                            URL signée (demandeur pour la sienne, admin pour toutes).
  provider-photo.ts         Photos des prestataires (bucket privé provider-photos) : upload
                            ({user}/{uuid}.jpg), URL signée 7 jours gardée en mémoire
                            (useProviderPhotoUrl), proposition d'une nouvelle photo.
  providers-store.ts        Fiches prestataires lues depuis la table providers ;
                            useProvider(id) / useProviders().
  provider-store.ts         Rôle prestataire : demandes ouvertes (list_open_requests, pas de
                            temps réel -> rechargées au focus / tirer pour rafraîchir), prénoms
                            des clients, sendQuote / startJob / completeJob.
  db-mappers.ts             Conversion lignes Supabase -> types du domaine (frontière DB/app).
                            Conversations/messages selon le rôle : senderId 'me' et compteur
                            de non-lus (client_ ou provider_unread_count).
  photo-upload.ts           Upload des photos du wizard vers Storage (bucket privé
                            booking-photos) + URLs signées pour l'affichage. Décodage base64
                            inline (pas de dépendance ajoutée).
  format.ts                 createFormatters(locale) : formatage fr-CA / en-CA (prix CAD,
                            dates), via le hook use-formats (langue active) ; formatAddress,
                            formatSector (ville · secteur), parseAmountInput (montant saisi),
                            formatMonthYear / formatWeekdayNarrow (calendrier), locale.
  calendar.ts               Dates du calendrier, en heure locale, sans dépendance : clés
                            YYYY-MM-DD, semaine (lundi en fr, dimanche en en), grille du mois.
  provider-dashboard.ts     Calculs purs du tableau de bord prestataire (prochaine mission,
                            compteurs, missions par jour, à planifier).
  booking-status.ts         Libellés/tons des statuts de réservation + statusLine (règle de la
                            phrase de statut côté client : offres reçues, date de passage…)
  supabase.ts               Client Supabase (auth/DB/realtime) ; `isSupabaseConfigured`
                            reste false tant que .env est vide (app fonctionnelle sans).
                            flowType 'pkce' (échange de code OAuth), detectSessionInUrl false.
  database.types.ts         Type `Database` du schéma Postgres, aligné sur types.ts
  database-applications.types.ts  Tables/RPC de l'adhésion et des photos, fusionnées dans `Database`
                            (fichier séparé : plafond de 300 lignes). Alias `type`, pas
                            `interface` : sinon l'inférence supabase-js tombe à `never`.
  auth-store.ts             Store Zustand auth (signUp/signIn/signInWithOAuth/signOut,
                            session), séparé du store applicatif ; `initAuth()` au montage.
                            signInWithOAuth : flux navigateur (expo-web-browser) + échange
                            du code sur le deep link (Linking.createURL('auth-callback')).
src/i18n/index.ts           Init i18next (FR/EN) : langue par défaut = langue de l'appareil
                            (fallback fr), persistance AsyncStorage (`tocato-language`),
                            loadSavedLanguage()/changeLanguage(). Monté dans app/_layout.tsx.
src/locales/{fr,en}.ts      Catalogues de traduction (source de vérité des textes UI).
                            Dépassent volontairement le plafond 300 lignes (voir anti-dérive).
src/constants/theme.ts      Design tokens : couleurs light/dark (dont accent chaud), Font (une
                            famille par graisse), FONT_FILES, Elevation (ombres, aucune en
                            sombre), spacing, radius, fontsize (dont display)
src/hooks/use-color-scheme.ts  Color scheme actif (variante .web.ts pour le rendu web)
src/hooks/use-theme.ts      Accès au thème selon le color scheme (+ useElevation)
src/hooks/use-press-scale.ts Contraction au toucher (reanimated), coupée si « réduire les
                            animations » est actif
src/hooks/use-formats.ts    Formatters (prix/dates) liés à la langue active (fr-CA / en-CA)
src/hooks/use-auth-guard.ts Redirige selon la session ET le rôle : connexion, app client,
                            onglets prestataire (Accueil) ou /apply (demandeur) ; sort chacun des routes
                            des autres rôles ; /admin réservé aux admins (inactif sans Supabase).
                            Renvoie « route posée » : _layout garde l'écran de démarrage
                            jusque-là et jusqu'au premier chargement des données
                            (auth-store `dataReady`), 5 s max ; sinon un prestataire voit
                            l'accueil client, puis des listes vides, un instant. Les
                            racines de rôle ((tabs), (provider), (auth), apply) s'ouvrent
                            sans animation (le glissement iOS du
                            replace montrait encore l'accueil client après le splash).
                            Inactive tant que la police charge : _layout ne rend pas
                            encore le Stack, et naviguer avant son montage lève une erreur.
src/hooks/use-counterpart.ts Nom de « l'autre » dans une conversation selon le rôle
                            (prestataire pour un client, prénom du client pour un prestataire)
src/hooks/use-provider-dashboard.ts  Données de l'Accueil prestataire (store + calculs).
src/hooks/use-mission-when.ts  « jeudi 25 septembre · matin », ou « Dès que possible ».
src/hooks/use-status-line.ts  Phrase de statut d'une réservation (client), dans la langue active.
supabase/schema.sql         Schéma Postgres : tables + migrations + Realtime + bucket Storage
                            booking-photos. Miroir de lib/types.ts. Pas de policies (voir
                            policies.sql).
supabase/rpc.sql            Fonctions/triggers (create_booking = demande ouverte sans
                            prestataire, trigger messages) : à exécuter APRÈS schema.sql.
supabase/transitions.sql    Transitions d'état (security definer, à exécuter APRÈS rpc.sql) :
                            accept_quote, decline_quote, cancel_booking, set_booking_photos,
                            mark_conversation_read. Voir section Sécurité des données.
supabase/providers.sql      Comptes prestataires : current_provider_id, list_open_requests
                            (sans adresse exacte), send_quote, start_job, complete_job,
                            provider_conversation_clients, admin_link_provider (admin).
supabase/applications.sql   Adhésion des prestataires : admins + is_admin, rbq_licences
                            (extrait du registre RBQ), provider_applications, bucket
                            provider-documents, submit_provider_application (avec photo).
                            Voir docs/adhesion-prestataires.md.
supabase/photos.sql         Photos des prestataires : bucket provider-photos,
                            provider_photo_changes (photo proposée, privée),
                            provider_photo_visible, submit_provider_photo.
supabase/admin.sql          Actions de l'admin : admin_approve/reject_application (la photo
                            de la demande devient celle de la fiche), admin_list_applicants,
                            admin_rbq_registry_status, admin_approve/reject_photo.
supabase/policies.sql       Toutes les policies RLS + Storage (client et prestataire), en
                            dernier. Voir section Sécurité des données.
supabase/apply.sh           Applique les huit fichiers à la base partagée (main uniquement)
supabase/rbq-import.sh      Importe le registre des licences RBQ (nocturne via GitHub Action)
.github/workflows/          rbq-import.yml : import RBQ chaque nuit (secret SUPABASE_DB_URL) ;
                            purge-documents.yml : appelle purge-documents chaque nuit
                            (variables SUPABASE_URL, SUPABASE_ANON_KEY)
supabase/functions/         Edge Functions (Deno, exclues du tsconfig) : purge-documents.
supabase/tests/             Tests SQL hors projet réel : run.sh (Postgres Docker),
                            supabase-stubs.sql (auth.uid, rôles, storage simulés),
                            scenarios.sql (client), scenarios-provider.sql (prestataire),
                            scenarios-applications.sql (adhésion), scenarios-photos.sql.
docs/                       Documents de conception, validés en PR avant le code.
  interface-prestataire.md  Appel d'offres + comptes prestataires (lots 1 à 5, tous faits).
  adhesion-prestataires.md  Inscription et vérification des prestataires (RBQ, pièces,
                            approbation admin). Validé, lots en cours.
  experience-emotionnelle.md  Design émotionnel (fondations, mouvement, haptique), photos
                            des prestataires, tableau de bord prestataire avec calendrier,
                            moments clés côté client. Validé, lots 1 à 4 faits.
  devis-et-fin-de-mission.md  Devis complet avec date d'intervention, changement de date,
                            note du prestataire, conversations fermées après la mission.
                            À valider.
```

**Alias** : `@/*` → `./src/*`, `@/assets/*` → `./assets/*` (tsconfig.json).

## i18n (bilingue FR/EN)

L'UI est bilingue, **français par défaut**. Choix produit assumé (marché montréalais), d'où
les dépendances `i18next` / `react-i18next` / `expo-localization`.

- **Source de vérité des textes** : `src/locales/fr.ts` et `src/locales/en.ts`. Tout texte
  affiché passe par une clé i18n : **jamais de chaîne UI en dur dans un écran ou composant**.
  Les deux catalogues doivent rester **structurellement identiques** (mêmes clés).
- **Accès** : hook `useTranslation()` (`const { t } = useTranslation()`), puis `t('cle.sous-cle')`.
- **Catalogue de services** : ne pas dupliquer les libellés dans `services.ts` ; passer par
  `useLocalizedService(id)` qui résout nom/tagline/questions/options via les clés i18n.
- **Formatage** : utiliser le hook `useFormats()` (prix CAD, dates), pas `format.ts`
  directement, pour que la locale suive la langue active (fr-CA / en-CA).
- **Langue** : détectée depuis l'appareil au premier lancement, surchargée et persistée via
  le sélecteur dans `profil.tsx` (`changeLanguage`), restaurée par `loadSavedLanguage()`.
- **Ajouter un texte** : ajouter la clé dans `fr.ts` **et** `en.ts` (sinon fallback FR).
- **Messages système** (« Devis accepté… », « Intervention terminée »…) : écrits par les RPC
  avec une **clé** `messages.system_key` (+ le texte FR côté client dans `text`, pour les
  anciennes versions de l'app). L'app les affiche via `useSystemMessageText()`
  (`hooks/use-message-text.ts`) : clé `systemMessages.<clé>.<client|provider>`, donc dans
  la langue active **et** du point de vue de celui qui lit. Ajouter un message système =
  ajouter la clé à la contrainte `messages_system_key_valid` (schema.sql), au type
  `SystemMessageKey` (types.ts) et aux deux catalogues (versions client et prestataire).

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
   dans l'allowlist *Redirect URLs* : le `redirect_to` est alors **ignoré** et il retombe
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
  (non-null assertion) : prouver l'existence avec une garde (`if (!x) return/throw`).
- Tous les types du domaine vivent dans `src/lib/types.ts` : c'est la source de vérité,
  et le futur contrat d'API du backend. Pas de types métier redéfinis dans les écrans.
- Un accès indexé (`array[i]`, `record[key]`) retourne `T | undefined` : toujours gérer le
  cas `undefined` explicitement.
- `npx tsc --noEmit` doit passer à zéro erreur avant de conclure toute modification.

## Sécurité des données (RLS + RPC)

La clé anon est publique : **tout ce que la RLS permet, n'importe qui peut le faire**
depuis un client modifié, pas seulement depuis l'app. D'où la règle :

- **Lecture** (`policies.sql`) : le client lit ses données (owner). Le prestataire
  (`current_provider_id()`) lit ses conversations et leurs messages, et **seulement** les
  réservations où il est **retenu**. Une demande ouverte ne lui est **jamais** lisible en
  ligne entière (l'adresse y figure) : il passe par `list_open_requests` (ville + secteur
  postal, ex. `H2J`). Photos : lisibles par le prestataire si la demande est ouverte dans
  un de ses services ou lui est confiée. `profiles` reste owner-only (prénom du client
  via `provider_conversation_clients`).
- **Anon** (non connecté) ne lit **rien**, catalogue `providers` compris : toutes les
  policies de lecture sont `to authenticated`. Une policy qui appelle une fonction
  réservée à `authenticated` (ex. `current_provider_id()`) **doit** être `to
  authenticated`, sinon une requête anon échoue (« permission denied for function »)
  au lieu de renvoyer une liste vide : **piège vérifié** sur la base réelle après le lot 3.
- **Écriture** : **aucune policy `update`** sur `bookings`, `conversations`, `messages`,
  et pas d'`insert` direct sur `bookings` / `conversations`. Toute transition d'état
  passe par une fonction `security definer` (`rpc.sql`, `transitions.sql`) qui vérifie
  **qui** appelle (`auth.uid()`) et **si** la transition est permise, puis l'applique
  atomiquement. Seule exception : les messages **texte**, insérés directement par le
  client (`sender_kind = 'client'`) ou le prestataire (`'provider'`, à son nom), chacun
  dans ses conversations. Les messages `system` et les devis viennent des RPC
  (`send_quote`).
- **Rôle prestataire** : une fiche `providers` avec `user_id` = le compte. Aucune colonne
  de rôle modifiable par l'utilisateur ; seul `admin_link_provider` (exécutable par
  l'admin uniquement) pose le lien. v1 : un compte prestataire ne peut pas créer de
  demande (`create_booking` refuse), un demandeur d'adhésion non plus.
- **Admin** : une ligne dans `admins` (aucune policy : ni lisible ni modifiable depuis
  l'app) ; `is_admin()` la consulte. Les RPC admin sont accordées à `authenticated`
  mais refusent (`not_admin`) sans `is_admin()`. **Adhésion** : `provider_applications`
  lisible par le demandeur et l'admin, écrite seulement par `submit_provider_application`
  (qui vérifie la licence RBQ) et `admin_approve_application` / `admin_reject_application`.
  L'approbation crée la fiche (`verified = true`) et la relie au compte. Pièces
  justificatives : bucket privé `provider-documents`, lisible par le propriétaire et
  l'admin seulement.
- **Photos des prestataires** : bucket privé `provider-photos`. Une photo n'est publiée
  (`providers.photo_path`) qu'après validation de l'admin : à l'approbation de
  l'adhésion, puis à chaque changement (`provider_photo_changes`, lisible par le
  prestataire et l'admin seulement, écrite par `submit_provider_photo` et
  `admin_approve/reject_photo`). Lecture Storage (`provider_photo_visible`) : une photo
  publiée par tout compte **connecté**, les autres par leur propriétaire et l'admin ; anon
  ne lit rien. Ni update ni delete : chaque envoi crée un fichier, `purge-documents`
  nettoie.
- Chaque nouvelle RPC : `security definer` + `set search_path = public`, vérification
  explicite d'`auth.uid()`, `revoke execute ... from public, anon` + `grant ... to
  authenticated`, type ajouté dans `database.types.ts > Functions` (ou
  `database-applications.types.ts`), scénario ajouté dans `supabase/tests/`.
- Historique : avant septembre 2026, `bookings_all_own` et `messages_update_own` laissaient
  le client écrire `status` / `agreed_price` et modifier le montant d'un devis. Corrigé
  (lot 1 de `docs/interface-prestataire.md`).

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
    nécessaire**, réservée aux catalogues i18n : elle ne s'étend à aucun fichier de code.
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
- Couleur de marque : `#1C6B3E` (clair) / `#3AB869` (sombre) : toujours passer par
  `useTheme()`, jamais de couleurs en dur dans les écrans (exception : avatars et logo).
- Chaque composant : styles statiques dans `StyleSheet.create`, couleurs dynamiques inline
  depuis `useTheme()`.
- **Texte : jamais `fontWeight`**, toujours la famille de la graisse (`...Font.semibold`,
  `...Font.bold`…) ; un style de texte sans graisse prend `...Font.regular`. Avec une
  police personnalisée, chaque graisse est une famille distincte : `fontWeight` seul
  retomberait sur la police système, et combiné, Android simulerait le gras. Préférer
  `AppText` (variantes `display`, `title`, `heading`…) à un `Text` brut.
- **Ombres** : `useElevation()` (`boxShadow`, pris en charge par iOS, Android et le web),
  jamais de `shadow*` en dur. En sombre, une bordure fine à la place (voir `Card`).
- **Haptique** : seulement via `lib/haptics.ts` (`select` pour un choix, `success` pour une
  action clé réussie), jamais `expo-haptics` directement. Les actions du store qui
  déclenchent un succès renvoient `true`/`false` (`respondToQuote`, `startJob`,
  `completeJob`).
- **Mouvement** : court (150 à 300 ms), aucune boucle sauf les squelettes, et toujours
  compatible « réduire les animations » (`useReducedMotion`). Principes complets :
  `docs/experience-emotionnelle.md` §3.
- **Célébrations** (`components/celebration`) : réservées à trois moments (demande
  envoyée, devis accepté, mission terminée), jamais pour une action ordinaire.
- **États vides** : `EmptyState` avec une illustration de `components/illustrations`
  (SVG aux couleurs du thème, pas d'image PNG) sur les écrans principaux ; un état vide
  encourage (quoi faire ensuite) au lieu de constater.
- Sélecteurs Zustand : ne jamais retourner un objet/tableau neuf dans le sélecteur
  (boucle de re-render avec Zustand v5) : sélectionner le tableau brut et filtrer en
  `useMemo` dans le composant.
- Flux principal de l'app (**appel d'offres**) : demande (wizard, sans choix de
  prestataire) → réservation `pending` sans prestataire → chaque prestataire intéressé
  ouvre sa conversation avec un devis → le client en accepte un (`accept_quote`) →
  réservation `confirmed` avec ce prestataire, devis concurrents `declined` et autres
  prestataires prévenus. Détails : `docs/interface-prestataire.md`.

## Données de test

L'état applicatif (réservations, conversations, messages) vit dans **Supabase** : le store
n'est **pas** persisté en AsyncStorage. Aucun mock ni aucune donnée de démo : les fiches
prestataires sont lues depuis la table `providers` (`lib/providers-store.ts`).

**Plus de simulation** (lot 5, septembre 2026) : les six fiches de démo (Marc, Amadou…),
l'Edge Function `provider-reply`, la RPC `seed_demo` et « Profil → Réinitialiser la démo »
ont été supprimés après un test de bout en bout avec deux appareils. La migration de
`schema.sql` a effacé leurs données (réservations qui ne tenaient qu'à elles, offres de
démo) et la colonne `providers.is_demo`. Les photos Storage de ces réservations restent
dans le bucket (fichiers orphelins, sans effet).

**Tester le flux** : deux comptes, un client et un prestataire relié (fiche `p-test`,
voir ci-dessous). Une demande n'a d'offre que si un prestataire relié du service répond.
L'accueil masque « Prestataires populaires » tant qu'aucune fiche vérifiée n'existe.

## Admin et prestataires réels

**Désigner l'admin** (une seule fois, SQL editor ou psql ; aujourd'hui Tristan seul) :

```sql
insert into admins (user_id) select id from auth.users where email = 'courriel@exemple.ca'
on conflict do nothing;
```

**Adhésion** (`docs/adhesion-prestataires.md`) : un prestataire s'inscrit avec « Je suis
prestataire » et envoie sa demande (avec sa photo) ; l'admin l'approuve ou la refuse dans
l'app (Profil → Adhésions prestataires). Une nouvelle photo proposée ensuite depuis le
profil prestataire apparaît dans « Photos à valider » sur le même écran. En secours :

**Relier à la main** dans le SQL editor (rôle admin), une fois que la personne s'est
**inscrite dans l'app** :

```sql
-- 1. Créer sa fiche (id libre, préfixe p-, services parmi plumber/mover/gardener)
insert into providers (id, name, services, hourly_rate, bio, member_since, verified)
values ('p-prenom', 'Prénom Nom', array['plumber'], 90, 'Présentation…', '2026', true);
-- 2. La relier à son compte (courriel utilisé à l'inscription)
select admin_link_provider('p-prenom', 'courriel@exemple.ca');
-- Délier : update providers set user_id = null where id = 'p-prenom';
```

Un compte ne peut être relié qu'à une fiche. À la
connexion suivante (ou relance de l'app), il bascule sur l'**interface prestataire**
(onglets Accueil / Demandes / Mes travaux / Messages / Profil) ; il ne peut plus créer de
demande.

## Notes

- Identité git : `tristan-devos <tristan2003devos@gmail.com>` (config globale, compte GitHub
  `tristan-devos`). Les commits antérieurs à juin 2026 portent l'ancienne identité
  `tristan-dev1 <2534117@etu.cchic.ca>` ; ne pas réécrire l'historique.
- **Branche `main` protégée** (côté GitHub) : push direct interdit, tout passe par une PR
  (mergeable par soi-même, aucune review requise) ; force-push et suppression bloqués ;
  résolution des conversations requise ; règle appliquée aux admins. Flux : brancher
  (`feat/...`), pousser, `gh pr create`, puis merger. Réglage modifiable dans
  *Settings → Branches* ou via `gh api repos/tristan-devos/TOCATO/branches/main/protection`.
- L'ancien prototype web (export Figma Make) a été entièrement supprimé en juin 2026 :
  l'historique git le conserve si besoin.
