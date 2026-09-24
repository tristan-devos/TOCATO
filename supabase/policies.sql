-- =============================================================================
-- TOCATO : règles d'accès : RLS + Storage (à exécuter EN DERNIER, après admin.sql)
-- =============================================================================
-- Lecture : policies `select` ci-dessous, côté client (owner) et côté prestataire
-- (current_provider_id(), providers.sql). Écriture : aucune policy update ; seuls
-- les messages TEXTE s'insèrent directement (client ou prestataire, chacun dans
-- ses conversations). Tout le reste passe par des RPC security definer.
-- Les policies qui appellent current_provider_id() sont `to authenticated` : anon n'a
-- pas le droit d'exécuter la fonction, et une policy évaluée pour anon ferait échouer
-- la requête (« permission denied ») au lieu de renvoyer une liste vide.
-- Voir AGENTS.md > Sécurité des données. Idempotent (drop policy if exists).
-- =============================================================================
alter table public.profiles      enable row level security;
alter table public.addresses     enable row level security;
alter table public.providers     enable row level security;
alter table public.bookings      enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;
alter table public.admins        enable row level security;
alter table public.rbq_licences  enable row level security;
alter table public.provider_applications enable row level security;
alter table public.provider_photo_changes enable row level security;
-- admins, rbq_licences : AUCUNE policy. Lus seulement par is_admin() et
-- rbq_check_licence (security definer), écrits par l'admin et rbq-import.sh.

-- provider_applications : le demandeur lit la sienne, l'admin les lit toutes.
-- Écritures : uniquement via submit_provider_application et les RPC admin.
drop policy if exists "provider_applications_select" on public.provider_applications;
create policy "provider_applications_select" on public.provider_applications
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- provider_photo_changes : le prestataire lit la sienne, l'admin les lit toutes.
-- Écritures : uniquement via submit_provider_photo et admin_approve/reject_photo.
drop policy if exists "provider_photo_changes_select" on public.provider_photo_changes;
create policy "provider_photo_changes_select" on public.provider_photo_changes
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- profiles : chacun gère son propre profil.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- addresses : owner-only (toutes opérations).
drop policy if exists "addresses_all_own" on public.addresses;
create policy "addresses_all_own" on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- providers : catalogue en lecture pour tout utilisateur connecté.
drop policy if exists "providers_select_all" on public.providers;
create policy "providers_select_all" on public.providers
  for select to authenticated using (true);

-- bookings : lecture owner-only. AUCUNE écriture directe : l'ancienne policy
-- `for all` laissait le client écrire status / agreed_price (se confirmer une
-- réservation au prix de son choix). Création via create_booking, transitions
-- via transitions.sql.
drop policy if exists "bookings_all_own" on public.bookings;
drop policy if exists "bookings_select_own" on public.bookings;
create policy "bookings_select_own" on public.bookings
  for select to authenticated using (auth.uid() = user_id);
-- Prestataire : uniquement les réservations où il est RETENU (devis accepté). Les
-- demandes ouvertes passent par list_open_requests (sans adresse exacte).
drop policy if exists "bookings_select_assigned_provider" on public.bookings;
create policy "bookings_select_assigned_provider" on public.bookings
  for select to authenticated using (provider_id is not null and provider_id = public.current_provider_id());

-- conversations : lecture owner-only, écritures via RPC (create_booking,
-- mark_conversation_read) et trigger handle_new_message.
drop policy if exists "conversations_all_own" on public.conversations;
drop policy if exists "conversations_select_own" on public.conversations;
create policy "conversations_select_own" on public.conversations
  for select to authenticated using (auth.uid() = user_id);
-- Prestataire : ses propres conversations (une par demande sur laquelle il a offert).
drop policy if exists "conversations_select_provider" on public.conversations;
create policy "conversations_select_provider" on public.conversations
  for select to authenticated using (provider_id = public.current_provider_id());

-- messages : lisibles par les deux participants de la conversation.
drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own" on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.user_id = auth.uid() or c.provider_id = public.current_provider_id())
    )
  );
-- Le client n'insère que des messages texte signés 'client'. Les messages
-- 'system' viennent des RPC (security definer), les devis de send_quote : ni un
-- faux devis ni un faux « Devis accepté » ne peuvent être forgés depuis l'app.
drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages
  for insert with check (
    messages.sender_kind = 'client'
    and messages.type = 'text'
    and messages.quote is null
    and messages.document is null
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );
-- Prestataire : messages texte signés 'provider' à son nom, dans SES conversations.
drop policy if exists "messages_insert_provider" on public.messages;
create policy "messages_insert_provider" on public.messages
  for insert to authenticated with check (
    messages.sender_kind = 'provider'
    and messages.type = 'text'
    and messages.quote is null
    and messages.document is null
    and messages.provider_id = public.current_provider_id()
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.provider_id = messages.provider_id
    )
  );
-- Pas d'update direct : l'ancienne policy laissait le client modifier
-- n'importe quel message, y compris le montant d'un devis du prestataire.
-- Le statut d'un devis change via accept_quote / decline_quote.
drop policy if exists "messages_update_own" on public.messages;

-- =============================================================================
-- Storage : bucket privé booking-photos, chemin {user_id}/{booking_id}/{n}.jpg.
-- Le client gère son dossier (1er segment = son id). Le prestataire LIT les photos
-- d'une demande ouverte dans ses services ou d'une réservation qui lui est confiée
-- (2e segment = id de la demande, provider_can_see_booking).
-- =============================================================================
drop policy if exists "booking_photos_select_own" on storage.objects;
create policy "booking_photos_select_own" on storage.objects
  for select to authenticated using (
    bucket_id = 'booking-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "booking_photos_insert_own" on storage.objects;
create policy "booking_photos_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'booking-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "booking_photos_delete_own" on storage.objects;
create policy "booking_photos_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'booking-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "booking_photos_select_provider" on storage.objects;
create policy "booking_photos_select_provider" on storage.objects
  for select to authenticated using (
    bucket_id = 'booking-photos'
    and public.provider_can_see_booking((storage.foldername(name))[2])
  );

-- =============================================================================
-- Storage : bucket privé provider-documents (pièce d'identité, assurance),
-- chemin {user_id}/.... Le demandeur gère son dossier ; seul l'admin lit les autres.
-- Pas d'update : un renvoi téléverse de nouveaux fichiers (nouveaux chemins).
-- =============================================================================
drop policy if exists "provider_documents_select" on storage.objects;
create policy "provider_documents_select" on storage.objects
  for select to authenticated using (
    bucket_id = 'provider-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
drop policy if exists "provider_documents_insert_own" on storage.objects;
create policy "provider_documents_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'provider-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "provider_documents_delete_own" on storage.objects;
create policy "provider_documents_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'provider-documents' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- Storage : bucket privé provider-photos, chemin {user_id}/{uuid}.jpg.
-- Lecture : une photo publiée (providers.photo_path) par tout compte connecté, les
-- autres (demande d'adhésion, changement en attente) par leur propriétaire et l'admin
-- (provider_photo_visible). Anon ne lit rien. Écriture dans son dossier seulement.
-- Ni update ni delete : chaque envoi crée un nouveau fichier, et purge-documents
-- efface ceux que plus rien ne référence (une photo publiée ne peut pas disparaître).
-- =============================================================================
drop policy if exists "provider_photos_select" on storage.objects;
create policy "provider_photos_select" on storage.objects
  for select to authenticated using (
    bucket_id = 'provider-photos' and public.provider_photo_visible(name)
  );
drop policy if exists "provider_photos_insert_own" on storage.objects;
create policy "provider_photos_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'provider-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
