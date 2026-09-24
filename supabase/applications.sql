-- =============================================================================
-- TOCATO : adhésion des prestataires (à exécuter APRÈS reviews.sql, AVANT photos.sql)
-- =============================================================================
-- Un prestataire DEMANDE à adhérer (submit_provider_application), le serveur vérifie
-- sa licence RBQ (plomberie) dans rbq_licences, et l'admin approuve ou refuse
-- (admin.sql). À l'approbation, la fiche providers est créée et reliée au compte : le
-- rôle reste déduit de la base, jamais d'une colonne modifiable par l'utilisateur.
-- Voir docs/adhesion-prestataires.md. Idempotent, ré-exécutable.
-- =============================================================================

-- --- admins : rempli à la main (SQL editor), jamais depuis l'app ---------------
create table if not exists public.admins (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- --- rbq_licences : extrait du registre RBQ (données ouvertes, CC-BY 4.0) -------
-- Remplacé en entier par supabase/rbq-import.sh (import nocturne). Seulement les
-- entrepreneurs ayant une sous-catégorie utile. Numéros stockés sans tirets.
create table if not exists public.rbq_licences (
  licence_no    text primary key,
  name          text not null,
  neq           text,
  subcategories text[] not null default '{}',
  restricted    boolean not null default false,
  municipality  text not null default '',
  imported_at   timestamptz not null default now()
);

-- --- provider_applications : une demande par compte ----------------------------
create table if not exists public.provider_applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references public.profiles (id) on delete cascade,
  status           text not null default 'submitted'
    check (status in ('submitted', 'approved', 'rejected')),
  business_name    text not null,
  services         text[] not null
    check (cardinality(services) > 0 and services <@ array['plumber', 'mover', 'gardener']::text[]),
  neq              text not null check (neq ~ '^[0-9]{10}$'),
  rbq_licence      text check (rbq_licence ~ '^[0-9]{10}$'),
  hourly_rate      numeric(10, 2) not null check (hourly_rate > 0 and hourly_rate < 1000),
  bio              text not null default '',
  -- Chemins Storage (bucket privé provider-documents), {user_id}/....
  -- La pièce d'identité est effacée 30 jours après la décision (Loi 25, Edge Function
  -- purge-documents) : chemin remis à null, date gardée comme trace.
  id_document_path text,
  id_document_purged_at timestamptz,
  insurance_path   text not null,
  -- Photo de profil (bucket provider-photos, voir photos.sql), publiée à l'approbation.
  -- Effacée 30 jours après un refus, comme la pièce d'identité.
  photo_path       text,
  -- Résultat de la vérification RBQ au moment de l'envoi (null hors plomberie).
  rbq_check        jsonb,
  submitted_at     timestamptz not null default now(),
  decided_at       timestamptz,
  decided_by       uuid references public.profiles (id),
  rejection_reason text,
  provider_id      text references public.providers (id)
);

-- Migration (lot 5) : pièce d'identité effaçable.
alter table public.provider_applications alter column id_document_path drop not null;
alter table public.provider_applications add column if not exists id_document_purged_at timestamptz;
-- Migration (photos des prestataires) : null pour les demandes antérieures.
alter table public.provider_applications add column if not exists photo_path text;

-- Realtime : le demandeur voit la décision arriver (approbation ou refus).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
                 and schemaname = 'public' and tablename = 'provider_applications') then
    alter publication supabase_realtime add table public.provider_applications;
  end if;
end $$;

-- Bucket privé des pièces justificatives. Policies : voir policies.sql.
insert into storage.buckets (id, name, public)
values ('provider-documents', 'provider-documents', false)
on conflict (id) do nothing;

-- --- rbq_check_licence : vérifie une licence de plomberie (15.5) ---------------
-- Indicatif : l'admin décide. Garde le nom au registre et la date de l'import.
create or replace function public.rbq_check_licence(p_licence text, p_neq text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r        public.rbq_licences;
  v_result text;
begin
  if not exists (select 1 from public.rbq_licences) then
    return jsonb_build_object('result', 'registry_unavailable', 'checked_at', now());
  end if;
  select * into r from public.rbq_licences where licence_no = p_licence;
  if not found then
    v_result := 'not_found';
  elsif not ('15.5' = any (r.subcategories)) then
    v_result := 'missing_subcategory';
  elsif r.restricted then
    v_result := 'restricted';
  elsif r.neq is distinct from p_neq then
    v_result := 'neq_mismatch';
  else
    v_result := 'ok';
  end if;
  return jsonb_build_object(
    'result', v_result, 'checked_at', now(),
    'registry_name', r.name, 'registry_neq', r.neq, 'imported_at', r.imported_at
  );
end;
$$;

-- Ne garde que les chiffres (« 1100-3571-01 » -> « 1100357101 »).
create or replace function public.digits_only(p text)
returns text
language sql
immutable
as $$ select regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g') $$;

-- --- submit_provider_application : envoyer (ou renvoyer après refus) ------------
-- Migration (photos) : l'ancienne signature, sans photo, disparaît.
drop function if exists public.submit_provider_application(
  text, text[], text, text, numeric, text, text, text);
create or replace function public.submit_provider_application(
  p_business_name    text,
  p_services         text[],
  p_neq              text,
  p_rbq_licence      text,
  p_hourly_rate      numeric,
  p_bio              text,
  p_id_document_path text,
  p_insurance_path   text,
  p_photo_path       text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_neq     text := public.digits_only(p_neq);
  v_licence text := nullif(public.digits_only(p_rbq_licence), '');
  v_status  text;
  v_id      uuid;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if public.current_provider_id() is not null then raise exception 'already_provider'; end if;
  -- Un demandeur n'est pas client (règle v1) : pas de compte client déjà actif.
  if exists (select 1 from public.bookings where user_id = v_uid) then
    raise exception 'client_account';
  end if;
  select status into v_status from public.provider_applications where user_id = v_uid;
  if v_status in ('submitted', 'approved') then raise exception 'application_exists'; end if;

  if coalesce(btrim(p_business_name), '') = '' then raise exception 'invalid_business_name'; end if;
  if coalesce(cardinality(p_services), 0) = 0
     or not (p_services <@ array['plumber', 'mover', 'gardener']::text[]) then
    raise exception 'invalid_services';
  end if;
  if v_neq !~ '^[0-9]{10}$' then raise exception 'invalid_neq'; end if;
  if 'plumber' = any (p_services) and (v_licence is null or v_licence !~ '^[0-9]{10}$') then
    raise exception 'rbq_licence_required';
  end if;
  if p_hourly_rate is null or p_hourly_rate <= 0 or p_hourly_rate >= 1000 then
    raise exception 'invalid_hourly_rate';
  end if;
  -- Pièces dans SON dossier du bucket (la policy Storage l'impose déjà à l'upload).
  if split_part(coalesce(p_id_document_path, ''), '/', 1) <> v_uid::text
     or split_part(coalesce(p_insurance_path, ''), '/', 1) <> v_uid::text then
    raise exception 'invalid_document_path';
  end if;
  -- Photo obligatoire, dans son dossier du bucket provider-photos.
  if split_part(coalesce(p_photo_path, ''), '/', 1) <> v_uid::text then
    raise exception 'invalid_photo_path';
  end if;

  insert into public.provider_applications as a (
    user_id, status, business_name, services, neq, rbq_licence, hourly_rate, bio,
    id_document_path, insurance_path, photo_path, rbq_check, submitted_at
  ) values (
    v_uid, 'submitted', btrim(p_business_name), p_services, v_neq,
    case when 'plumber' = any (p_services) then v_licence end, p_hourly_rate,
    coalesce(btrim(p_bio), ''), p_id_document_path, p_insurance_path, p_photo_path,
    case when 'plumber' = any (p_services) then public.rbq_check_licence(v_licence, v_neq) end,
    now()
  )
  on conflict (user_id) do update set
    status = 'submitted', business_name = excluded.business_name,
    services = excluded.services, neq = excluded.neq, rbq_licence = excluded.rbq_licence,
    hourly_rate = excluded.hourly_rate, bio = excluded.bio,
    id_document_path = excluded.id_document_path, id_document_purged_at = null,
    insurance_path = excluded.insurance_path, photo_path = excluded.photo_path,
    rbq_check = excluded.rbq_check, submitted_at = now(),
    decided_at = null, decided_by = null, rejection_reason = null
  returning a.id into v_id;
  return v_id;
end;
$$;

-- --- Droits d'exécution --------------------------------------------------------
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.rbq_check_licence(text, text) from public, anon, authenticated;
revoke execute on function public.submit_provider_application(
  text, text[], text, text, numeric, text, text, text, text) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.submit_provider_application(
  text, text[], text, text, numeric, text, text, text, text) to authenticated;
