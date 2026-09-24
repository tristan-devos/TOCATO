# Conception : expérience émotionnelle, photos des prestataires, tableau de bord

> **Statut : validé** (2026-09-24), en cours de réalisation (voir §8).
> Rédigé le 2026-09-24. Chaque lot (§8) devient une PR, et `AGENTS.md` est mis à jour
> dans la PR qui change le comportement décrit. Les écarts au plan seront notés
> « **Réalisé :** » dans la section concernée.

## 1. Problème

L'app fonctionne de bout en bout, mais elle est **neutre** : cartes plates (bordure fine,
`opacity` au toucher), aucune animation alors que `react-native-reanimated` est installé,
un seul retour haptique (envoi d'une demande), des avatars en initiales, des listes vides
pendant le chargement. Le prestataire n'a qu'une liste de missions : rien ne lui dit
« voilà ta semaine ».

Pour une app de services à domicile, l'émotion qui compte n'est pas l'effet visuel :
c'est la **confiance** (je laisse entrer quelqu'un chez moi) et le **soulagement**
(c'est réglé). Tout ce document sert ces deux sentiments ; un effet qui ne les sert pas
n'entre pas.

## 2. Décisions déjà prises (2026-09-24)

| Question | Décision |
|---|---|
| Photo du prestataire | **Fournie à l'adhésion, validée par l'admin.** Une photo changée après l'approbation repasse par l'admin avant d'être publiée. |
| Tableau de bord prestataire | **Nouvel onglet « Accueil »**, en premier : Accueil, Demandes, Mes travaux, Messages, Profil. Symétrique avec le client. |
| Police | **Police personnalisée** (Google Fonts), nouvelle dépendance justifiée dans `AGENTS.md`. |

## 3. Principes (grille de relecture des PR)

Inspirés des trois niveaux de Don Norman (viscéral, comportemental, réflexif), ramenés
à des règles vérifiables :

1. **Chaque action a une réponse.** Un toucher se voit (échelle 0,97, ressort court) ;
   une action qui compte se sent (haptique) ; une attente se montre (squelette, jamais
   un écran vide ni un spinner seul).
2. **Des visages, pas des fiches.** Partout où un prestataire apparaît côté client
   (offres reçues, chat, détail réservation, accueil), sa photo. Initiales seulement
   en repli.
3. **Célébrer les vrais moments, et eux seuls.** Demande envoyée, devis accepté,
   mission terminée. Pas de confettis pour un message envoyé.
4. **Toujours savoir où on en est.** Le statut d'une réservation se lit en une seconde
   (couleur, icône, phrase humaine : « Marc arrive demain matin », pas « confirmed »).
5. **Une voix chaleureuse et québécoise.** Tutoiement ou vouvoiement tranché une fois
   pour toutes (§9), phrases courtes, états vides qui encouragent au lieu de constater.
6. **Sobriété du mouvement.** Durées 150 à 300 ms, pas d'animation en boucle, et
   `useReducedMotion()` (reanimated) coupe tout sauf les fondus.

## 4. Lot 1 : fondations (tout le reste s'appuie dessus)

### Typographie

- Famille proposée : **Plus Jakarta Sans** (chaleureuse, très lisible en petit, accents
  français complets), graisses 400, 600, 700, 800. Alternatives à comparer sur une capture
  dans la PR : DM Sans, Figtree.
- Dépendances : `@expo-google-fonts/plus-jakarta-sans` et `expo-font` (déjà présent en
  transitif via `expo`, à déclarer par `npx expo install expo-font`). Compatible Expo Go
  (police chargée au runtime, pas de plugin natif).
- Chargement dans `app/_layout.tsx` par `useFonts`, **écran de démarrage gardé** jusqu'au
  chargement (même mécanisme que `dataReady`). En cas d'échec : police système, l'app
  démarre quand même.
- Échelle : `FontSize` gagne `display` (34) pour les titres d'accueil ; `AppText` porte
  la famille selon la variante, les écrans ne la choisissent jamais.

### Profondeur et couleur

- Nouveau token `Shadow` (`sm`, `md`) dans `theme.ts` : ombre douce en clair, remplacée
  par une bordure plus claire en sombre (une ombre ne se voit pas sur fond sombre).
- `Card` : ombre `sm` à la place de la bordure en mode clair.
- Une couleur **chaude d'accent** (ambre, pour les moments positifs : note, célébration)
  en plus du vert de marque, déclinée clair/sombre, contraste AA vérifié.

### Mouvement et toucher

- Hook `usePressScale()` (reanimated) appliqué à `Button`, `Card` pressable, `Chip`,
  `ServiceCard`.
- Module `lib/haptics.ts` : `tap()`, `success()`, `warning()`, pour qu'aucun écran
  n'appelle `expo-haptics` directement. Sans effet sur le web.
- Primitive `ui/skeleton.tsx` (bloc pulsé) + variantes `BookingCardSkeleton`,
  `ConversationSkeleton`, affichées tant que `dataReady` est faux.
- Entrée des listes : fondu + légère montée (`FadeInDown` de reanimated), décalé de
  40 ms par élément, **au premier affichage seulement**.

Aucun changement SQL.

**Réalisé :** `fontWeight` retiré partout au profit de `Font.<graisse>` (une famille par
graisse). Le layout racine ne rend rien tant que la police charge (moins d'une seconde,
sous l'écran de démarrage) ; la garde d'auth attend le montage du Stack. Contraction au
toucher : composant `ui/pressable-scale.tsx` (plutôt que le hook seul, pour garder les
couleurs d'état pressé) ; `ServiceCard` et `BookingCard` en profitent via `Card`. Le
squelette pulse en boucle : seule exception à la règle 6, figée si « réduire les
animations » est actif. Squelettes et entrées branchés sur Réservations, Mes travaux et
Messages. Haptique : `select` sur `Chip` et `SegmentedControl`, `success` sur demande
envoyée, devis envoyé, devis accepté, mission commencée ou terminée (les actions du store
renvoient désormais un booléen). La variante `display` est appliquée à la salutation de
l'accueil client ; le reste de l'accueil attend le lot 4. Hors plan : `src/global.css`
(variables de police web jamais lues) supprimé ; `npx expo lint` a installé `eslint` et
`eslint-config-expo` avec leur configuration, gardés.

## 5. Lot 2 : photos des prestataires

### Données

- Nouveau bucket **privé** `provider-photos`, chemin `{user_id}/{uuid}.jpg` (un nouveau
  nom à chaque envoi : pas de cache périmé chez les clients).
- `provider_applications.photo_path` (obligatoire pour une nouvelle demande, nullable
  pour les demandes existantes).
- `providers.photo_path` (photo publiée) et `providers.pending_photo_path` (photo en
  attente de validation).
- `admin_approve_application` recopie `photo_path` dans `providers.photo_path`.
- Nouvelles RPC : `submit_provider_photo(p_path)` (prestataire relié : pose
  `pending_photo_path`), `admin_approve_photo(p_provider_id)` et
  `admin_reject_photo(p_provider_id)`.

### Qui lit quoi (RLS Storage)

| Objet | Lisible par |
|---|---|
| Photo publiée (`providers.photo_path`) | tout compte **connecté** (anon ne lit rien, règle inchangée) |
| Photo en attente ou de demande d'adhésion | le propriétaire et l'admin |
| Écriture | le propriétaire, dans son dossier seulement |

Bucket privé plutôt que public : une URL publique serait lisible sans compte, contraire
à la règle « anon ne lit rien ». Affichage par **URL signée longue** (7 jours), mise en
cache dans `providers-store` et passée à `expo-image` avec `cacheKey = photo_path`
(l'URL signée change, l'image reste en cache).

### Interface

- Formulaire d'adhésion, étape documents : « Votre photo » (cadrage carré, recadrage
  `expo-image-picker` `allowsEditing`), avec les consignes (visage visible, fond neutre)
  et la mention Loi 25 : « Visible par les clients connectés à TOCATO ».
- Admin : la photo dans le détail d'une demande ; une section « Photos à valider » dans
  la liste (changements après approbation).
- Profil prestataire : « Changer ma photo », avec le badge « En attente de validation ».
- `Avatar` accepte `uri?` : photo si présente, initiales sinon. Utilisé tel quel dans
  `ProviderRow`, `provider-offers`, l'en-tête du chat et `provider/[id]`.

### Vie privée

`purge-documents` efface aussi : les photos refusées, les photos remplacées, et la photo
d'une demande refusée 30 jours après la décision (même règle que la pièce d'identité).

### Tests SQL

Scénarios : un client lit une photo publiée mais pas une photo en attente ; anon ne lit
rien ; un prestataire ne pose pas de photo dans le dossier d'un autre ; seul l'admin
valide ; l'approbation d'une demande publie sa photo.

**Réalisé :** écart au plan sur les données : la photo proposée après approbation vit
dans une table privée `provider_photo_changes` (une ligne par fiche, statut, motif de
refus) et non dans `providers.pending_photo_path` : `providers` est lisible par tous les
comptes connectés, une photo en attente et le motif d'un refus ne regardent que le
prestataire et l'admin. Le refus demande un motif, affiché au prestataire. Fichiers SQL :
`applications.sql` dépassait 300 lignes, ses RPC admin passent dans un nouveau
`admin.sql` (avec celles des photos) ; le reste des photos est dans `photos.sql`. La
signature de `submit_provider_application` change (photo obligatoire, `p_photo_path`) :
une ancienne version de l'app ne peut plus envoyer de demande. Les demandes antérieures
n'ont pas de photo (fiche en initiales, l'admin voit « aucune photo »). Avatars avec
photo : `ProviderAvatar` dans les offres reçues (via `ProviderRow`), la liste et l'en-tête
des conversations côté client, les cartes de réservation, le profil public, le profil
prestataire et l'admin. Purge : photo d'une demande refusée effacée après 30 jours,
fichiers non référencés après 24 h.

## 6. Lot 3 : tableau de bord prestataire (onglet Accueil)

```
┌─────────────────────────────────────┐
│ Bonjour Marc 👋        [photo]       │  salutation selon l'heure
│ Mercredi 24 septembre               │
├─────────────────────────────────────┤
│ PROCHAINE MISSION                   │  carte mise en avant (couleur de marque)
│ Plomberie · Jeudi matin             │  en cours > confirmée la plus proche
│ Julie · Plateau-Mont-Royal (H2J)    │
│ [Voir la mission]                   │
├──────────┬──────────┬───────────────┤
│ 3        │ 2        │ 1 240 $       │  tuiles chiffrées, tap = écran concerné
│ à venir  │ devis en │ terminé ce    │
│          │ attente  │ mois          │
├─────────────────────────────────────┤
│ ‹  Septembre 2026  ›   [Semaine|Mois]│  calendrier
│ L  M  M  J  V  S  D                 │  point de couleur = mission ce jour-là
│ 22 23 24 25 26 27 28                │
│        ●  ●                         │
├─────────────────────────────────────┤
│ Jeudi 25 : 2 missions               │  missions du jour choisi
│ • Matin · Plomberie · Julie         │
│ • Soir · Jardinage · Paul           │
├─────────────────────────────────────┤
│ À PLANIFIER (1)                     │  missions « dès que possible » (sans date)
└─────────────────────────────────────┘
```

- **Calendrier fait maison**, sans dépendance : vue semaine par défaut (bande de 7 jours,
  glissement horizontal), bascule mois (grille). Logique de dates dans
  `lib/calendar.ts` (semaines ISO, lundi en premier en fr-CA, dimanche en en-CA),
  rendu dans `components/provider/calendar-*.tsx`, chaque fichier sous 300 lignes.
- Sources : missions retenues du store (`scheduledDate`, `timeSlot`), devis en attente
  (messages `quote` au statut `pending` de ses conversations), demandes ouvertes
  (`provider-store`). Calculs dans `lib/provider-dashboard.ts`, l'écran compose.
- **Piège** : une mission « dès que possible » n'a pas de date. Elle va dans
  « À planifier », jamais dans un jour inventé.
- **Chiffre du mois** : somme des `agreedPrice` des missions terminées ce mois-ci. Libellé
  « Terminé ce mois », **pas** « revenus » : l'app n'encaisse rien, c'est le montant
  des devis acceptés.
- **Petit changement SQL** : `bookings.completed_at` n'existe pas, et sans lui « ce
  mois-ci » est impossible à calculer. Ajout de la colonne, posée par `complete_job`
  (missions déjà terminées : `null`, comptées nulle part). Scénario de test ajouté.
- État vide (nouveau prestataire) : illustration + « Ta première demande t'attend » +
  bouton vers Demandes.
- Tirer pour rafraîchir recharge les demandes ouvertes (comme l'onglet Demandes).

**Réalisé :** tel que prévu, avec ces précisions. La prochaine mission est celle en
cours, sinon la confirmée la plus proche ; une mission confirmée dont la date est passée
passe en premier (en retard). Changement de semaine ou de mois par les flèches (pas de
glissement : conflit avec le défilement de l'écran) ; toucher le mois revient à
aujourd'hui. Le calendrier montre aussi les missions terminées (historique du mois),
jamais les annulées. Tuiles : « à venir » et « terminé ce mois » ouvrent Mes travaux,
« devis en attente » ouvre Messages ; pas de tuile « demandes ouvertes » (onglet voisin).
Nouveau prestataire (ni mission ni devis) : carte d'invitation vers Demandes et message
d'accueil, sans calendrier ; l'illustration attend le lot 4. Tirer pour rafraîchir
recharge réservations et messages (les demandes ouvertes ne sont pas sur cet écran).
`completed_at` est posé par `complete_job` ; les missions terminées avant n'entrent dans
aucun mois. Textes au vouvoiement, comme le reste de l'interface prestataire (§9 pas
encore tranché).

## 7. Lot 4 : moments clés côté client

- **Célébrations** (lot 1 requis) : `BookingSuccess` animé (coche qui se dessine en SVG,
  haptique `success`) ; même traitement à l'acceptation d'un devis (« C'est réglé !
  Marc viendra jeudi matin ») et à la mission terminée, côté client et prestataire.
- **Offres reçues** : grande photo, note, « vérifié RBQ » visible, montant mis en valeur.
  C'est l'écran où la confiance se décide.
- **Statut humain** : sous le badge de statut, une phrase contextuelle générée par
  `lib/booking-status.ts` (« 2 offres reçues », « Marc arrive demain matin »).
- **États vides illustrés** : 4 à 5 illustrations SVG maison dans
  `components/illustrations/` (react-native-svg, déjà installé), aux couleurs du thème
  (clair et sombre), pas d'images PNG.
- **Accueil client** : bloc d'accroche sous la salutation, cartes de service avec
  illustration, bandeau de confiance plus présent.

## 8. Découpage en PR (lots)

1. ✅ **Fondations** : police, tokens (ombre, accent, `display`), `usePressScale`,
   `lib/haptics.ts`, squelettes. Pas de SQL.
2. ✅ **Photos des prestataires** : SQL (bucket, colonnes, RPC, policies, scénarios),
   formulaire d'adhésion, admin, profil prestataire, `Avatar` avec photo, purge.
3. ✅ **Tableau de bord prestataire** : onglet Accueil, calendrier, tuiles, `completed_at`.
4. **Moments clés côté client** : célébrations, offres reçues, statuts humains,
   illustrations.

Chaque lot : `npx tsc --noEmit`, `npx expo export --platform web`, `supabase/tests/run.sh`
si le SQL change, test sur iPhone via EAS Update, captures avant/après dans la PR.

## 9. Choix par défaut (modifiables, à confirmer en réunion)

| Question | Défaut proposé |
|---|---|
| Tutoiement ou vouvoiement ? | **Vouvoiement** côté client (on entre chez les gens), **tutoiement** côté prestataire (outil de travail, ton d'équipe). Les textes actuels vouvoient. |
| Photo obligatoire pour les prestataires déjà approuvés ? | Non : initiales en repli, rappel « Ajoutez votre photo » dans leur profil. |
| Sons ? | Non (Expo Go, et gênant sur un chantier). Haptique seulement. |
| Illustrations : maison ou banque d'images ? | Maison, SVG simple, pour garder le thème clair/sombre et zéro dépendance. |
