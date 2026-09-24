# Conception : devis complet, date d'intervention, fin de mission

> **Statut : validé** (2026-09-24, choix du §9 confirmés), lots 1 à 3 faits (§8).
> Rédigé le 2026-09-24. Chaque lot (§8) devient une PR, et `AGENTS.md` est mis à jour
> dans la PR qui change le comportement décrit. Les écarts au plan seront notés
> « **Réalisé :** » dans la section concernée.

## 1. Problème

1. **Une mission « dès que possible » n'a jamais de date.** Elle reste dans « À planifier »
   côté prestataire ; la date se règle dans le chat, sans que l'app le sache. Le client ne
   sait pas quand on vient, le calendrier du prestataire est faux.
2. **Un devis est pauvre** : un montant et un texte libre. Le client ne peut comparer ni
   le contenu (main-d'œuvre, pièces, déplacement), ni la durée, ni la date proposée.
3. **Rien ne se passe après l'intervention.** Pas de note : `providers.rating`,
   `review_count` et `jobs_completed` ne sont **jamais mis à jour** (valeurs figées à la
   création de la fiche). La conversation reste ouverte sans objet.

## 2. Décisions déjà prises (2026-09-24)

| Question | Décision |
|---|---|
| Date d'une mission « dès que possible » | **Proposée dans le devis** ; accepter le devis fixe la date. |
| Changer la date après l'accord | **Le prestataire propose, le client accepte ou refuse** ; l'ancienne date reste tant que le client n'a pas accepté. |
| Contenu du devis | **Fiche complète** (§4). |
| Note du prestataire | **Par le client, à la fin de l'intervention, dans le chat.** |
| Conversation après l'intervention | **Bloquée** (voir la réserve au §6). |

## 3. Flux cible

```
Prestataire : devis = lignes (main-d'œuvre, pièces, déplacement…) + durée estimée
              + date et créneau proposés + garantie + ce qui est inclus
Client      : compare les offres (prix ET date) -> accepte
              -> réservation confirmée à la date du devis (fini « À planifier »)
Imprévu     : prestataire « Proposer une autre date » -> carte dans le chat
              -> client accepte (nouvelle date) ou refuse (date inchangée)
Fin         : prestataire « Terminer » -> carte « Comment s'est passée l'intervention ? »
              dans le chat -> client note (1 à 5 étoiles + commentaire facultatif)
              -> conversation en lecture seule (sauf la carte de notation)
```

## 4. La fiche devis

| Champ | Obligatoire | Détail |
|---|---|---|
| Lignes | oui, au moins une | Libellé + catégorie (main-d'œuvre, pièces et matériel, déplacement, autre) + montant. 10 lignes au plus. |
| Total | calculé | Somme des lignes, **calculée par le serveur** (jamais envoyée par l'app). |
| Date et créneau proposés | oui | Préremplis avec la date demandée ; obligatoires pour « dès que possible ». Aujourd'hui ou plus tard, 60 jours au plus. |
| Durée estimée | oui | En heures (0,5 à 24), indicative. |
| Ce qui est inclus | non | Texte libre (l'ancien champ « détails »), 2 000 caractères. |
| Garantie | non | Texte court (« Pièces et main-d'œuvre garanties 1 an »). |

- **Taxes** : v1 = « montant final, taxes comprises » écrit sur la carte. La facturation
  TPS / TVQ (prestataire inscrit ou petit fournisseur) est une question à part (§9).
- **Date différente de celle demandée** : autorisée, et signalée au client (« Date
  proposée : lundi, au lieu de jeudi demandé »).
- **Côté client, la carte d'offre** montre en plus la date proposée (« demain matin »),
  pour comparer la rapidité autant que le prix.
- Stockage : `messages.quote` (jsonb) gagne `lines`, `proposed_date`, `proposed_slot`,
  `duration_hours`, `warranty`. Les anciens devis (montant + détails) restent lisibles.
- `send_quote` prend ces champs, valide tout et calcule `amount`. `accept_quote` recopie
  la date et le créneau sur la réservation (`scheduled_date`, `time_slot`).

**Réalisé (lot 1) :** nouveau fichier `supabase/quotes.sql` (`send_quote` déplacé de
`providers.sql`, qui approchait 300 lignes ; les lots 2 et 3 y ajouteront leurs RPC).
« Aujourd'hui » est la date de **Montréal** (`montreal_today()`) : la base tourne en UTC,
où il est déjà demain après 20 h.
L'ancienne signature de `send_quote` est supprimée : une ancienne version de l'app ne
peut plus envoyer de devis. La bande de jours et les créneaux du wizard sont extraits
dans `components/ui/day-slot-picker.tsx`, partagé avec le devis. Un devis dont la date
diffère de celle demandée le signale des deux côtés (formulaire et carte d'offre).

## 5. Changer la date après l'accord

- Nouveau type de message **`reschedule`** (carte dans le chat, comme un devis) :
  date, créneau, motif facultatif, statut `pending` / `accepted` / `declined`.
- RPC `propose_reschedule(booking, date, slot, reason)` : prestataire retenu, mission
  `confirmed` (pas une fois commencée), une seule proposition en attente.
- RPC `respond_reschedule(message, accept)` : client. Accepter change la date de la
  réservation ; refuser ne change rien. Message système dans les deux cas.
- Le client ne propose pas de date en v1 : il écrit dans le chat, le prestataire propose.

**Réalisé (lot 2) :** pas de message système `rescheduleProposed` : la carte de
proposition suffit (elle compte comme message non lu chez le client). La carte garde
l'ancienne date (`previous_date`, `previous_slot`) pour afficher « Au lieu de : … ».
Côté client, les boutons sont « Garder la date prévue » et « Accepter ». Côté mission,
le bouton « Proposer une autre date » est remplacé par un bandeau tant qu'une
proposition attend. Colonne `messages.reschedule` (jsonb), type de message
`reschedule` ; les policies d'insertion directe exigent `reschedule` vide.

## 6. Fin de mission : note et conversation fermée

### Note

- À `complete_job`, un message **`review_request`** apparaît dans la conversation : côté
  client, une carte « Comment s'est passée l'intervention ? » avec 5 étoiles et un
  commentaire facultatif ; côté prestataire, « En attente de l'avis du client ».
- Table `reviews` : `booking_id` (clé), `provider_id`, `client_id`, `rating` (1 à 5),
  `comment` (500 caractères), `created_at`. **Une note par intervention**, non modifiable.
- RPC `submit_review(booking, rating, comment)` : client propriétaire, réservation
  `completed`, **30 jours** au plus après la fin, pas déjà notée.
- La fiche prestataire est recalculée dans la même transaction : `rating` (moyenne),
  `review_count`. `complete_job` incrémente enfin `jobs_completed`.
- Affichage : la carte devient « Vous avez donné 4 étoiles » ; le prestataire voit la note
  et le commentaire. Les commentaires ne sont **pas** publics en v1 (§9).

### Conversation fermée

- **Règle** : on écrit dans une conversation seulement si elle est utile. Demande ouverte :
  chaque prestataire intéressé ; après l'accord : le prestataire retenu, tant que la
  mission est `confirmed` ou `in_progress`. **Fermée** : mission terminée ou annulée, et
  conversations des prestataires non retenus (aujourd'hui elles restent ouvertes).
- Appliquée **par la RLS** (policies d'insert des messages) : un client modifié ne peut pas
  la contourner. L'app remplace la zone de saisie par un bandeau (« Intervention terminée :
  conversation fermée ») ; l'historique reste lisible (devis, adresse, documents).
- **Réserve (à trancher, §9)** : fermer tout de suite empêche aussi les échanges utiles
  juste après (facture oubliée, fuite qui reprend le soir, objet oublié chez le client).
  Proposition : **fermeture 48 h après la fin**, bandeau « Conversation ouverte jusqu'à
  samedi 18 h ». Sans délai, il faudra un canal « Signaler un problème » vers l'équipe,
  qui n'existe pas.

**Réalisé (lot 3) :** fichier `supabase/reviews.sql` (table `reviews`, `submit_review`,
`conversation_open`, délais `review_window` 30 j et `chat_grace` 48 h), entre `quotes.sql`
et `applications.sql`. Pas de messages système `reviewRequested` / `reviewSubmitted` :
la carte `review_request` (posée par `complete_job`) change d'elle-même d'état (« Vous
avez donné 4 étoiles », « Le client vous a donné 4 étoiles »). `complete_job` incrémente
`jobs_completed`. La règle de fermeture est dans les deux policies d'insertion des
messages (`messages_insert_own` passe `to authenticated`, comme l'autre) ; l'app la
reproduit dans `lib/conversation-state.ts` pour afficher « Conversation ouverte
jusqu'au … » puis le bandeau de fermeture (zone de saisie extraite dans
`chat/chat-composer.tsx`). Côté prestataire, une demande qu'il ne lit plus (confiée à
un autre ou annulée) affiche un message neutre : il ne peut pas savoir laquelle. La
célébration « mission terminée » du client l'invite à noter dans la conversation.

## 7. Sécurité et données

- Toutes les écritures passent par des RPC `security definer` (règle du projet) :
  `send_quote` (nouvelle signature), `propose_reschedule`, `respond_reschedule`,
  `submit_review`. Scénarios de test pour chacune.
- `reviews` : lisible par le client auteur, le prestataire noté et l'admin ; aucune
  écriture directe. La note moyenne reste publique via `providers` (comme aujourd'hui).
- Nouvelles clés de messages système : `rescheduleProposed`, `rescheduleAccepted`,
  `rescheduleDeclined`, `reviewRequested`, `reviewSubmitted` (contrainte
  `messages_system_key_valid`, `SystemMessageKey`, catalogues client et prestataire).
- Types de message : `messages.type` gagne `reschedule` et `review_request`.
- Réservations existantes : inchangées ; une mission déjà « à planifier » le reste (le
  prestataire peut désormais lui proposer une date par §5).

## 8. Découpage en PR (lots)

1. ✅ **Devis complet et date** : SQL (`send_quote` v2, `accept_quote` recopie la date),
   formulaire de devis en étapes, carte de devis détaillée dans le chat, carte d'offre
   avec la date proposée, phrase de statut.
2. ✅ **Changer la date** : message `reschedule`, deux RPC, bouton côté mission, carte dans
   le chat, calendrier mis à jour.
3. ✅ **Fin de mission** : `reviews`, `submit_review`, recalcul de la fiche,
   `jobs_completed`, carte de notation dans le chat, conversations fermées (RLS + bandeau).

Chaque lot : `tsc`, export web, `supabase/tests/run.sh`, test sur iPhone via EAS Update.

## 9. Choix confirmés (2026-09-24)

| Question | Décision |
|---|---|
| Fermeture de la conversation : immédiate ou après un délai ? | **48 h après la fin** (voir §6). |
| Taxes (TPS / TVQ) sur le devis | « Taxes comprises » en v1 ; le détail des taxes quand on saura quels prestataires sont inscrits. |
| Commentaires des avis publics sur la fiche du prestataire ? | Non en v1 (modération à prévoir) ; la note moyenne est publique. |
| Le prestataire note-t-il aussi le client ? | Non en v1. |
| Délai pour noter | 30 jours après la fin. |
| Un prestataire peut-il proposer une autre date qu'une demande datée ? | Oui, signalé au client. |
