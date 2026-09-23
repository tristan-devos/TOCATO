# Conception — interface prestataire (appel d'offres)

> **Statut : validé**, en cours de réalisation — lots 1, 2 et 3 faits (voir §9).
> Rédigé le 2026-09-23. Chaque lot ci-dessous devient une PR, et `AGENTS.md` est mis à
> jour dans la PR qui change le comportement décrit. Les écarts au plan sont notés
> « **Réalisé :** » dans la section concernée.

## 1. Décisions déjà prises

| Question | Décision | Conséquence |
|---|---|---|
| Comment une demande arrive chez un prestataire ? | **Appel d'offres** | La demande est visible par tous les prestataires du service ; chacun peut envoyer un devis ; le client en accepte un. |
| Comment devient-on prestataire ? | **Validé à la main** | On s'inscrit comme tout le monde, puis un admin relie le compte à une fiche `providers` (SQL documenté). Personne ne peut s'autoproclamer prestataire. |
| Où vit l'interface ? | **Même app, selon le rôle** | Un compte relié à une fiche prestataire voit des onglets prestataire. Un seul projet Expo, un seul EAS Update. |

## 2. Flux cible

```
Client                                   Prestataire (service = plombier)
──────                                   ─────────────────────────────────
Wizard (sans choix de prestataire)
  → demande `pending`, provider_id = null
                                         Onglet « Demandes » : voit la demande
                                         (quartier, date, réponses, photos —
                                          PAS l'adresse exacte ni le nom complet)
                                         « Envoyer un devis » (montant + détails)
                                           → crée SA conversation + message devis
Détail réservation :
« Offres reçues (N) », une par presta
Chat avec chaque prestataire
Accepte un devis
  → réservation `confirmed`, provider_id fixé,
    agreed_price = montant
  → devis concurrents `declined`,
    message système dans leurs conversations
                                         Voit « Devis accepté » + adresse exacte
                                         Onglet « Mes travaux » :
                                         « Commencer » → `in_progress`
                                         « Terminer »  → `completed`
```

Annulation : le client peut annuler tant que la demande n'est pas `in_progress`.
Chaque conversation de la demande reçoit un message système.

## 3. Constats sur le code actuel (à corriger en chemin)

1. **Les prestataires ne sont pas des utilisateurs.** `providers` est un catalogue
   (`p-marc`…) sans lien avec `auth.users`.
2. **RLS 100 % côté client.** Un prestataire connecté ne verrait aucune demande.
3. **Trou de sécurité — réservations.** `bookings_all_own` permet au client d'écrire
   directement `status` et `agreed_price` : il peut se confirmer une réservation au
   prix de son choix. Aujourd'hui `respondToQuote` et `cancelBooking` font ces
   `update` depuis l'app.
4. **Trou de sécurité — messages.** `messages_update_own` permet au client de
   modifier **n'importe quel** message de sa conversation, y compris le montant d'un
   devis du prestataire.
5. **Un seul compteur de non-lus** (`conversations.unread_count`), pensé pour le
   client. Il en faut un par côté.

Règle retenue pour 3 et 4 : **toute transition d'état passe par une fonction SQL
(RPC) qui vérifie qui appelle et si la transition est permise.** L'app ne fait plus
d'`update` direct sur `bookings` ni sur `messages`.

## 4. Modèle de données

### Tables modifiées

- **`providers`** : `+ user_id uuid unique null references profiles(id)`. Null pour
  les fiches de démo ; renseigné par l'admin pour un vrai prestataire. **Être
  prestataire = avoir une fiche dont `user_id = auth.uid()`** (pas de colonne
  `role` modifiable par l'utilisateur).
- **`bookings`** (repris de la PR #8) : `provider_id` devient **nullable** (fixé à
  l'acceptation), `conversation_id` est **supprimée** (N conversations par demande
  via `conversations.booking_id`).
- **`conversations`** : index unique `(booking_id, provider_id)` (une conversation
  par prestataire et par demande) ; `unread_count` remplacée par
  `client_unread_count` + `provider_unread_count`. Le trigger `handle_new_message`
  incrémente le compteur de **l'autre** côté.
- **`messages`** : inchangée. `sender_kind = 'provider'` devient insérable par le
  prestataire de la conversation (plus seulement par le serveur).

### Fonction d'aide

`current_provider_id()` (`security definer`, `stable`) : renvoie l'id de la fiche
prestataire du compte connecté, ou `null`. Utilisée dans toutes les policies.

## 5. Règles d'accès (RLS)

| Table | Client | Prestataire |
|---|---|---|
| `bookings` select | ses demandes | celles où il est `provider_id`, ou où il a une conversation |
| `bookings` insert | ses demandes, `status = 'pending'`, `provider_id` null | — |
| `bookings` update | **aucun** (RPC) | **aucun** (RPC) |
| `conversations` select | les siennes | les siennes (`provider_id = current_provider_id()`) |
| `messages` select | ses conversations | ses conversations |
| `messages` insert | `client` dans ses conversations | `provider` dans ses conversations, `provider_id` = le sien |
| `messages` update | **aucun** (RPC) | **aucun** (RPC) |
| Storage `booking-photos` | ses dossiers | lecture si la demande est ouverte dans un de ses services, ou s'il y a une conversation |

**Demandes ouvertes = RPC, pas une policy.** Une policy RLS donne accès à la ligne
entière, donc à l'adresse exacte du client. Les prestataires listent les demandes
ouvertes via `list_open_requests()` (`security definer`), qui ne renvoie que :
service, date/créneau, réponses, description, photos, estimation, **ville + 3
premiers caractères du code postal** (ex. `H2J`, le secteur). L'adresse exacte et
le nom du client ne sont visibles qu'**après acceptation du devis**.

Le prénom du client doit s'afficher dans le chat côté prestataire : exposé via
`list_provider_conversations()` (prénom seul), `profiles` restant owner-only.

**Réalisé (lot 3) — écarts :**
- `bookings` select prestataire : **seulement** les réservations où il est retenu, pas
  celles « où il a une conversation » (le tableau ci-dessus) — sinon la ligne entière,
  adresse exacte comprise, serait lisible dès son offre, contrairement à la règle
  ci-dessus. Tant que la demande est ouverte, il la voit via `list_open_requests`, qui
  renvoie aussi `my_conversation_id` / `my_quote_status` (sa propre offre).
- Storage : lecture si la demande est ouverte dans un de ses services ou lui est confiée
  (pas « s'il y a une conversation », même raison).
- La RPC s'appelle `provider_conversation_clients()` (renvoie conversation + prénom).
- Toutes les policies sont regroupées dans `supabase/policies.sql`, exécuté en dernier.
- `create_booking` refuse un compte prestataire (question §10.5 tranchée : v1 = non).
- `cancel_booking` : plus possible une fois `in_progress` (règle du §2, désormais
  appliquée puisque `start_job` existe).
- **Reporté au lot 4** : l'app lit encore les fiches dans `mock-data.ts`, qui ne contient
  que les fiches de démo. Une fiche réelle n'y apparaît pas : le lot 4 doit charger les
  fiches depuis la table `providers` avant le test de bout en bout.

## 6. Fonctions serveur (RPC)

| RPC | Appelant | Effet (atomique) |
|---|---|---|
| `send_quote(booking_id, amount, details)` | prestataire | Vérifie : demande `pending`, service couvert, pas déjà un devis `pending` de sa part. Crée sa conversation si besoin + message `quote`. |
| `accept_quote(message_id)` | client | Vérifie : devis `pending`, demande `pending` et à lui. Devis → `accepted`, demande → `confirmed` + `provider_id` + `agreed_price`, autres devis → `declined`, message système dans chaque conversation. |
| `decline_quote(message_id)` | client | Devis → `declined` + message système. |
| `cancel_booking(booking_id)` | client | Si `pending`/`confirmed` → `cancelled` + message système partout. |
| `start_job(booking_id)` / `complete_job(booking_id)` | prestataire assigné | `confirmed` → `in_progress` → `completed`. |
| `mark_conversation_read(conversation_id)` | les deux | Remet à zéro **son** compteur. |

**Réalisé (lot 2) :** `create_booking` est **conservée** (pas d'insert direct comme
prévu ici et dans la PR #8), mais sans prestataire : elle crée une demande ouverte et
renvoie son id. Raison : le lot 1 a posé la règle « aucune écriture directe sur
`bookings` » (voir `AGENTS.md` > Sécurité des données) ; une RPC force `status`,
`user_id` et `provider_id` sans avoir à les contraindre dans une policy.

## 7. Interface

### Navigation par rôle

Au chargement du profil, `profile-store` récupère aussi `current_provider_id()`.
`use-auth-guard` redirige vers `(provider)/` si le compte est prestataire, sinon
vers `(tabs)/`. Pas de bascule client ↔ prestataire en v1.

### Écrans prestataire (nouveaux)

- `(provider)/_layout.tsx` — onglets : **Demandes**, **Mes travaux**, **Messages**,
  **Profil**.
- `(provider)/index.tsx` — demandes ouvertes de ses services (`list_open_requests`).
- `request/[id].tsx` — détail d'une demande ouverte + formulaire de devis.
- `(provider)/jobs.tsx` — ses réservations `confirmed` / `in_progress` /
  historique, boutons « Commencer » / « Terminer ».
- `(provider)/profile.tsx` — sa fiche (lecture seule en v1 : modif via l'admin).
- **Réutilisés** : `chat/[id].tsx`, `message-bubble`, `ui/*`. Le côté « moi » d'une
  bulle dépend du rôle de l'utilisateur (voir `db-mappers.toSenderId`).

### Côté client (repris et adapté de la PR #8)

- Wizard : étape `provider-step` supprimée ; récap et succès réécrits.
- Détail réservation : section **Offres reçues (N)** tant que la demande est ouverte.
- Écran `provider/[id]` (profil public d'un prestataire).
- Onglets : ordre de la PR #8 (Réservations en 2e, Messages en 4e) — **à confirmer**.
  **Réalisé (lot 2) :** non repris, l'ordre actuel est conservé (sans lien avec l'appel
  d'offres) ; à trancher séparément.

## 8. Démo et simulation

Aujourd'hui l'Edge Function `provider-reply` fait répondre de faux prestataires.
Avec de vrais prestataires, des faux qui répondent aussi fausseraient les tests.
**Proposition** : `providers.is_demo boolean`. La simulation ne fait répondre que
les fiches de démo, et **uniquement si aucun vrai prestataire ne couvre le
service**. `seed_demo` reste pour la démo. Suppression complète au lot 5.

## 9. Découpage en PR (lots)

Chaque lot : `tsc` + export web + `expo-doctor` OK, fichiers < 300 lignes,
`AGENTS.md` / `README` à jour, `schema.sql` + `rpc.sql` idempotents et ré-exécutés.

1. ✅ **Sécuriser les transitions** (PR #13, + réparation PR #14) (indépendant, corrige les trous §3.3–3.4) :
   RPC `accept_quote` / `decline_quote` / `cancel_booking` / `mark_conversation_read`,
   suppression des `update` directs côté app et des policies d'update.
2. ✅ **Appel d'offres côté client** (reprise de la PR #8) : schéma N conversations,
   wizard sans choix, offres reçues, profil prestataire, simulation adaptée.
3. ✅ **Comptes prestataires côté serveur** : `providers.user_id`, `is_demo`,
   `current_provider_id()`, policies prestataire, `list_open_requests`,
   `send_quote`, `start_job` / `complete_job`, Storage, compteurs par côté,
   procédure SQL documentée pour relier un compte.
4. **Interface prestataire** : navigation par rôle, onglets et écrans du §7, i18n
   FR/EN, **fiches prestataires lues depuis la base** (au lieu de `mock-data.ts`).
5. **Nettoyage** : fin de la simulation, suppression de `mock-data.ts`.

Test de bout en bout après le lot 4 : ton collègue = client, un compte de test =
prestataire (relié à la main), puis un vrai prestataire recruté.

## 10. Questions ouvertes

1. **Notifications.** Sans notification push, un prestataire ne sait qu'une demande
   existe que s'il ouvre l'app : l'appel d'offres risque de rester sans réponse. À
   évaluer après le lot 4 (`expo-notifications` — vérifier ce qu'Expo Go permet
   encore sur iOS avant de s'engager ; sinon il faudra un build via `eas.json`).
2. **Durée de vie d'une demande sans offre.** Expire-t-elle (ex. 72 h) ?
3. **Nombre maximum d'offres par demande** (ex. 5) pour ne pas noyer le client ?
4. **Messages système en français seulement** (écrits en SQL). Dette existante ;
   à traiter en stockant une clé i18n plutôt qu'un texte ?
5. **Un prestataire peut-il aussi être client** avec le même compte ? v1 : non.
