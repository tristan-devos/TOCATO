# Conception : adhésion des prestataires (inscription et vérification)

> **Statut : validé** (2026-09-24), en cours de réalisation (voir §9).
> Rédigé le 2026-09-24. Chaque lot (§9) devient une PR, et `AGENTS.md` est mis à jour
> dans la PR qui change le comportement décrit. Les écarts au plan seront notés
> « **Réalisé :** » dans la section concernée.

## 1. Problème

Aujourd'hui, un prestataire s'inscrit comme un client, puis l'admin crée sa fiche et la
relie à son compte en SQL (`admin_link_provider`, voir `AGENTS.md`). C'est manuel, rien
ne garde la trace de ce qui a été vérifié, et rien ne prouve au client qu'un plombier a
le droit d'exercer. Objectif : un prestataire **demande** à adhérer depuis l'app, l'app
**vérifie** ce qui peut l'être, et l'admin **approuve** en un clic, avec une trace.

## 2. Décisions déjà prises (2026-09-24)

| Question | Décision |
|---|---|
| Point d'entrée | **Choix à l'inscription** : « Je cherche un service » ou « Je suis prestataire ». Un compte prestataire n'est pas client (règle v1 inchangée). |
| Validation | **Vérification automatique + approbation de l'admin.** Personne n'entre sans validation humaine au lancement. |
| Outil de l'admin | **Écran admin dans l'app** (plus de SQL à la main). |
| Pièces exigées | **NEQ**, **assurance responsabilité civile**, **pièce d'identité** ; en plus, pour la plomberie, **licence RBQ avec la sous-catégorie 15.5**. |
| Admin | **Tristan seul.** |

## 3. Ce que dit la loi, ce qu'on peut vérifier

- **Plomberie** : l'entrepreneur doit détenir une licence RBQ avec la sous-catégorie
  **15.5**, délivrée par la CMMTQ. Sans elle, il n'a pas le droit de faire ces travaux
  ([RBQ](https://www.rbq.gouv.qc.ca/en/you-are/citizen/check-a-contractors-licence/),
  [CMMTQ](https://www.cmmtq.org/devenir-entrepreneur/sous-categories-de-licence-exclusives-a-la-cmmtq)).
- **Déménagement, entretien de jardin** : pas de licence pour ce que l'app propose. On
  exige une entreprise enregistrée (NEQ) et une assurance.
- **Registre RBQ en données ouvertes** : [liste des licences actives](https://www.donneesquebec.ca/recherche/dataset/licencesactives),
  mise à jour **chaque jour**, licence **CC-BY 4.0** (attribution obligatoire). Relevé du
  2026-09-23 : 54 225 licences ; 2 283 entrepreneurs avec la 15.5, dont 324 à Montréal.
  Champs utiles : numéro de licence, statut, type (entrepreneur ou constructeur-
  propriétaire), restriction, NEQ, nom, municipalité, sous-catégories (une ligne par
  sous-catégorie). L'API de recherche du portail ne renvoie rien : seul le fichier
  complet (zip de 11 Mo, CSV de 340 Mo) est exploitable.
- **NEQ** : contrôlé au format (10 chiffres) et, pour un plombier, comparé à celui du
  registre RBQ. Pour les autres services, vérifié à l'œil par l'admin (lien vers le
  Registraire des entreprises).

## 4. Flux

```
Inscription « Je suis prestataire »
  -> formulaire d'adhésion (entreprise, services, NEQ, licence RBQ si plomberie,
     tarif, présentation, photos : pièce d'identité + certificat d'assurance)
  -> submit_provider_application : vérification RBQ immédiate, statut « submitted »
  -> écran « Demande en cours d'examen » (seul écran accessible à ce compte)
Admin : onglet « Adhésions » -> détail (résultat RBQ, pièces en URLs signées)
  -> Approuver : fiche providers créée (verified = true) et reliée au compte
       -> au prochain chargement, le compte bascule sur l'interface prestataire
  -> Refuser (motif obligatoire) : le demandeur voit le motif, corrige, renvoie
```

## 5. Modèle de données (nouveaux objets)

- **`admins`** (`user_id` clé primaire). Rempli à la main **une seule fois** dans le SQL
  editor (le courriel de l'admin ne va pas dans le repo). Aucune policy d'écriture.
  Fonction `is_admin()` (security definer, comme `current_provider_id()`).
- **`provider_applications`** : `id`, `user_id` (unique), `status`
  (`submitted` / `approved` / `rejected`), `business_name`, `services` (sous-ensemble du
  catalogue), `neq`, `rbq_licence` (null hors plomberie), `hourly_rate`, `bio`,
  `id_document_path`, `insurance_path`, `rbq_check` (jsonb, §6), `submitted_at`,
  `decided_at`, `decided_by`, `rejection_reason`, `provider_id` (renseigné à
  l'approbation).
- **`rbq_licences`** : extrait du registre limité aux **entrepreneurs** ayant une
  sous-catégorie utile (15.5 aujourd'hui) : `licence_no`, `status`, `name`, `neq`,
  `subcategories text[]`, `restricted`, `municipality`, `imported_at`. Environ 2 300
  lignes. Données publiques, mais lisibles seulement via les RPC (pas de policy).
- **Bucket privé `provider-documents`** : `{user_id}/id.jpg`, `{user_id}/insurance.jpg`.
  Lecture : le propriétaire et l'admin. Jamais les clients ni les autres prestataires.

`providers` ne change pas. Le rôle reste déduit de la base, jamais d'une colonne
modifiable par l'utilisateur.

## 6. Vérification RBQ

Faite **côté serveur** dans `submit_provider_application`, à partir de `rbq_licences` :

| Résultat (`rbq_check.result`) | Condition |
|---|---|
| `ok` | licence trouvée, active, type entrepreneur, sous-catégorie 15.5, sans restriction, NEQ identique |
| `not_found` | numéro absent du registre (ou licence inactive : le fichier ne liste que les actives) |
| `missing_subcategory` | licence active sans la 15.5 |
| `restricted` | licence avec restriction en cours |
| `neq_mismatch` | NEQ saisi différent de celui du registre |
| `registry_unavailable` | registre jamais importé (table vide) |

Le résultat est **indicatif** : l'admin décide. Le détail (nom au registre, date de
l'import) est gardé dans `rbq_check` pour la trace. L'écran admin affiche l'attribution
« Source : Régie du bâtiment du Québec, Données Québec (CC-BY 4.0) ».

**Import nocturne** (décision du 2026-09-24) : une GitHub Action planifiée lance
chaque nuit `supabase/rbq-import.sh`. Le script télécharge le zip, filtre en streaming
les lignes utiles et remplace le contenu de `rbq_licences` dans une transaction. Il se
lance aussi à la main, sur le modèle de `apply.sh` (Docker, `SUPABASE_DB_URL` lu dans
`.env`), en secours ou pour tester.

L'Action a besoin de `SUPABASE_DB_URL` dans les **secrets GitHub** (chiffré, jamais
affiché, même aux collaborateurs du repo). C'est le seul nouvel endroit où vit le mot
de passe de la base. Si le compte GitHub était compromis, la base le serait aussi :
risque accepté, parce qu'une vérification de licence vieille d'un mois ne légitime rien.

Garde-fous si l'import échoue plusieurs nuits : `rbq_check` garde la date de l'import
utilisé, et l'écran admin affiche « Registre importé il y a N jours » (en alerte au-delà
de 3 jours) avec le lien de vérification en ligne de la RBQ. Si la table est vide (jamais
importée), le résultat vaut `registry_unavailable`.
Écartée : une Edge Function planifiée (340 Mo de CSV, limites mémoire et durée).

## 7. Sécurité (règles de `AGENTS.md` appliquées)

- `provider_applications` : lecture par le propriétaire et l'admin ; **aucune écriture
  directe**. Tout passe par des RPC security definer :
  - `submit_provider_application(...)` : appelant connecté, pas déjà prestataire, pas de
    demande `submitted` ou `approved` en cours ; valide services, NEQ, licence ; calcule
    `rbq_check`. Renvoyer après un refus remet la demande en `submitted`.
  - `admin_approve_application(id)` : `is_admin()` exigé ; crée la fiche (`verified =
    true`) et pose `user_id` dans la même transaction ; refuse si le compte est déjà
    relié.
  - `admin_reject_application(id, reason)` : `is_admin()` exigé, motif non vide.
- Storage `provider-documents` : écriture dans son propre dossier seulement ; lecture
  propriétaire ou admin.
- `create_booking` refuse déjà les prestataires ; il refusera aussi un compte avec une
  demande d'adhésion (un demandeur n'est pas client).
- `admin_link_provider` reste en secours (compte `p-test`, cas particuliers).
- Scénarios ajoutés dans `supabase/tests/` pour chaque RPC et policy.

**Loi 25 (vie privée)** : la pièce d'identité est le document le plus sensible. Proposition :
elle est **supprimée 30 jours après la décision** (on garde la trace « vérifiée le …
par … », pas l'image). À refléter dans la politique de confidentialité.

## 8. Interface

- **Inscription** : un sélecteur (`segmented-control`) « Je cherche un service / Je suis
  prestataire » sur l'écran d'inscription, et sur le retour du login Google.
- **Formulaire d'adhésion** (`src/app/apply/`) : orchestrateur + une étape par fichier
  dans `components/apply/`, sur le modèle du wizard de réservation. Photos via
  `expo-image-picker` (déjà présent) : **pas de nouvelle dépendance** ; un PDF
  d'assurance se photographie ou se capture en image.
- **Statut de la demande** : écran unique tant que la demande est `submitted`
  (« en cours d'examen ») ou `rejected` (motif + « Corriger et renvoyer »).
- **Rôle** : `Role` gagne `applicant` et un indicateur `isAdmin` ; `use-auth-guard`
  cantonne un `applicant` à `apply/`. Le Realtime sur sa demande fait basculer le compte
  dès l'approbation.
- **Admin** : entrée « Adhésions » dans le profil si `isAdmin` ; liste (en attente
  d'abord), détail avec le résultat RBQ, les pièces (URLs signées) et les boutons
  Approuver / Refuser.
- Tous les textes en i18n FR/EN, fichiers sous 300 lignes.

## 9. Découpage en PR (lots)

1. **Serveur** : tables, `is_admin`, RPC, policies, bucket, scénarios SQL.
2. **Registre RBQ** : `rbq-import.sh`, GitHub Action nocturne, secret et doc dans `AGENTS.md`.
3. **App, côté demandeur** : choix à l'inscription, formulaire, écran de statut, rôle
   `applicant`.
4. **App, côté admin** : liste et détail des adhésions, approbation, refus.
5. **Vie privée** : suppression des pièces d'identité 30 jours après décision (tâche
   planifiée), mise à jour de la politique de confidentialité.

## 10. Choix par défaut (modifiables, à confirmer en réunion)

Pour ne pas bloquer le développement, les propositions suivantes sont appliquées :

1. **Mêmes pièces pour tous**, plombiers compris (pièce d'identité et assurance en plus
   de la licence RBQ).
2. **Nom affiché aux clients** : le nom de l'entreprise saisi dans la demande.
3. **Pièces d'identité supprimées 30 jours après la décision** (lot 5).
4. **Pas de courriel** de décision en v1 : le demandeur voit le résultat dans l'app.
