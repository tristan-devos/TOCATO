-- =============================================================================
-- TOCATO : comptes prestataires (à exécuter APRÈS transitions.sql, AVANT policies.sql)
-- =============================================================================
-- Être prestataire = avoir une fiche `providers` dont user_id = auth.uid(). Le lien
-- n'est posé que par un admin (admin_link_provider, SQL editor) : aucune colonne
-- « rôle » modifiable par l'utilisateur. Voir docs/interface-prestataire.md §4–6.
--
-- Confidentialité : un prestataire ne lit JAMAIS la table bookings d'une demande
-- ouverte (une policy exposerait la ligne entière, adresse comprise). Il passe par
-- list_open_requests, qui ne renvoie que la ville et le secteur postal (3 premiers
-- caractères). La ligne complète (adresse exacte) ne lui devient lisible qu'une
-- fois son devis accepté (policy bookings_select_assigned_provider).
-- Idempotent : `create or replace`, ré-exécutable.
-- =============================================================================

-- --- Aides (utilisées par les policies et les RPC) ------------------------
-- Fiche prestataire du compte connecté, ou null.
create or replace function public.current_provider_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.providers where user_id = auth.uid();
$$;

-- Le prestataire connecté peut-il voir cette demande (et ses photos) ?
-- Oui si elle est ouverte dans un de ses services, ou s'il en est le prestataire retenu.
-- Paramètre texte : appelée depuis la policy Storage avec un segment de chemin
-- arbitraire, comparé sans cast (un cast uuid lèverait une erreur sur un nom invalide).
drop function if exists public.provider_can_see_booking(uuid);
create or replace function public.provider_can_see_booking(p_booking_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.bookings b
    join public.providers p on p.user_id = auth.uid()
    where b.id::text = p_booking_id
      and (
        (b.status = 'pending' and b.provider_id is null and b.service_id = any (p.services))
        or b.provider_id = p.id
      )
  );
$$;

-- --- list_open_requests : demandes ouvertes dans ses services ------------
-- Sans adresse exacte ni nom du client. my_conversation_id / my_quote_status :
-- sa propre offre sur la demande, s'il en a fait une.
create or replace function public.list_open_requests()
returns table (
  id              uuid,
  service_id      text,
  created_at      timestamptz,
  scheduled_date  date,
  time_slot       text,
  city            text,
  postal_sector   text,
  answers         jsonb,
  description     text,
  photos          text[],
  estimate_min    numeric,
  estimate_max    numeric,
  my_conversation_id uuid,
  my_quote_status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id, b.service_id, b.created_at, b.scheduled_date, b.time_slot,
    b.address ->> 'city',
    upper(left(replace(coalesce(b.address ->> 'postalCode', ''), ' ', ''), 3)),
    b.answers, b.description, b.photos, b.estimate_min, b.estimate_max,
    c.id,
    (select m.quote ->> 'status' from public.messages m
     where m.conversation_id = c.id and m.type = 'quote'
     order by m.created_at desc limit 1)
  from public.bookings b
  join public.providers p on p.user_id = auth.uid()
  left join public.conversations c on c.booking_id = b.id and c.provider_id = p.id
  where b.status = 'pending'
    and b.provider_id is null
    and b.service_id = any (p.services)
  order by b.created_at desc;
$$;

-- send_quote : voir quotes.sql (fiche devis complète).

-- --- start_job / complete_job : le prestataire retenu fait avancer le travail ---
create or replace function public.start_job(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings set status = 'in_progress'
  where id = p_booking_id and status = 'confirmed'
    and provider_id = public.current_provider_id();
  if not found then raise exception 'job_not_startable'; end if;

  insert into public.messages (conversation_id, sender_kind, type, text, system_key)
  select c.id, 'system', 'system', 'Le prestataire a commencé l''intervention.', 'jobStarted'
  from public.conversations c
  where c.booking_id = p_booking_id and c.provider_id = public.current_provider_id();
end;
$$;

create or replace function public.complete_job(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.bookings set status = 'completed', completed_at = now()
  where id = p_booking_id and status = 'in_progress'
    and provider_id = public.current_provider_id();
  if not found then raise exception 'job_not_completable'; end if;

  -- Compteur de la fiche (« Prestations réalisées »), enfin tenu à jour.
  update public.providers set jobs_completed = jobs_completed + 1
  where id = public.current_provider_id();

  insert into public.messages (conversation_id, sender_kind, type, text, system_key)
  select c.id, 'system', 'system', 'Intervention terminée.', 'jobCompleted'
  from public.conversations c
  where c.booking_id = p_booking_id and c.provider_id = public.current_provider_id();

  -- Carte « Comment s'est passée l'intervention ? » (reviews.sql, submit_review).
  insert into public.messages (conversation_id, sender_kind, type, text)
  select c.id, 'system', 'review_request', ''
  from public.conversations c
  where c.booking_id = p_booking_id and c.provider_id = public.current_provider_id();
end;
$$;

-- --- provider_conversation_clients : prénom du client de ses conversations ---
-- profiles reste owner-only ; le prestataire n'obtient que le prénom.
create or replace function public.provider_conversation_clients()
returns table (conversation_id uuid, client_first_name text)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, split_part(pr.name, ' ', 1)
  from public.conversations c
  join public.profiles pr on pr.id = c.user_id
  where c.provider_id = public.current_provider_id();
$$;

-- --- admin_link_provider : relier un compte à une fiche (ADMIN SEULEMENT) --
-- À lancer dans le SQL editor (rôle postgres). Non exécutable depuis l'app.
-- Exemple : select admin_link_provider('p-paul', 'paul@exemple.ca');
-- La fiche doit exister (insert into providers ... ; voir AGENTS.md). Un compte ne
-- peut être relié qu'à une seule fiche (user_id unique).
create or replace function public.admin_link_provider(p_provider_id text, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(p_email);
  if v_user is null then raise exception 'user_not_found: %', p_email; end if;

  update public.providers set user_id = v_user where id = p_provider_id;
  if not found then raise exception 'provider_not_found: %', p_provider_id; end if;
end;
$$;

-- --- Droits d'exécution --------------------------------------------------
revoke execute on function public.current_provider_id() from public, anon;
revoke execute on function public.provider_can_see_booking(text) from public, anon;
revoke execute on function public.list_open_requests() from public, anon;
revoke execute on function public.start_job(uuid) from public, anon;
revoke execute on function public.complete_job(uuid) from public, anon;
revoke execute on function public.provider_conversation_clients() from public, anon;
grant execute on function public.current_provider_id() to authenticated;
grant execute on function public.provider_can_see_booking(text) to authenticated;
grant execute on function public.list_open_requests() to authenticated;
grant execute on function public.start_job(uuid) to authenticated;
grant execute on function public.complete_job(uuid) to authenticated;
grant execute on function public.provider_conversation_clients() to authenticated;
-- Admin : personne d'autre que le propriétaire (postgres, SQL editor).
revoke execute on function public.admin_link_provider(text, text)
  from public, anon, authenticated;
