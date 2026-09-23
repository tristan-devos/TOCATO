-- =============================================================================
-- TOCATO : adhésion des prestataires (à exécuter APRÈS providers.sql, AVANT policies.sql)
-- =============================================================================
-- Un prestataire DEMANDE à adhérer (submit_provider_application), le serveur vérifie
-- sa licence RBQ (plomberie) dans rbq_licences, et l'admin approuve ou refuse. À
-- l'approbation, la fiche providers est créée et reliée au compte : le rôle reste
-- déduit de la base, jamais d'une colonne modifiable par l'utilisateur.
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
  id_document_path text not null,
  insurance_path   text not null,
  -- Résultat de la vérification RBQ au moment de l'envoi (null hors plomberie).
  rbq_check        jsonb,
  submitted_at     timestamptz not null default now(),
  decided_at       timestamptz,
  decided_by       uuid references public.profiles (id),
  rejection_reason text,
  provider_id      text references public.providers (id)
);

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
create or replace function public.submit_provider_application(
  p_business_name    text,
  p_services         text[],
  p_neq              text,
  p_rbq_licence      text,
  p_hourly_rate      numeric,
  p_bio              text,
  p_id_document_path text,
  p_insurance_path   text
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

  insert into public.provider_applications as a (
    user_id, status, business_name, services, neq, rbq_licence, hourly_rate, bio,
    id_document_path, insurance_path, rbq_check, submitted_at
  ) values (
    v_uid, 'submitted', btrim(p_business_name), p_services, v_neq,
    case when 'plumber' = any (p_services) then v_licence end, p_hourly_rate,
    coalesce(btrim(p_bio), ''), p_id_document_path, p_insurance_path,
    case when 'plumber' = any (p_services) then public.rbq_check_licence(v_licence, v_neq) end,
    now()
  )
  on conflict (user_id) do update set
    status = 'submitted', business_name = excluded.business_name,
    services = excluded.services, neq = excluded.neq, rbq_licence = excluded.rbq_licence,
    hourly_rate = excluded.hourly_rate, bio = excluded.bio,
    id_document_path = excluded.id_document_path, insurance_path = excluded.insurance_path,
    rbq_check = excluded.rbq_check, submitted_at = now(),
    decided_at = null, decided_by = null, rejection_reason = null
  returning a.id into v_id;
  return v_id;
end;
$$;

-- --- admin_approve_application : crée la fiche et la relie au compte ------------
create or replace function public.admin_approve_application(p_application_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  a          public.provider_applications;
  v_provider text;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  select * into a from public.provider_applications where id = p_application_id for update;
  if not found or a.status <> 'submitted' then raise exception 'application_not_pending'; end if;
  if exists (select 1 from public.providers where user_id = a.user_id) then
    raise exception 'already_linked';
  end if;

  v_provider := 'p-' || left(replace(a.id::text, '-', ''), 12);
  insert into public.providers (id, name, services, hourly_rate, bio, member_since, verified, user_id)
  values (v_provider, a.business_name, a.services, a.hourly_rate, a.bio,
          extract(year from now())::text, true, a.user_id);

  update public.provider_applications
  set status = 'approved', decided_at = now(), decided_by = auth.uid(),
      rejection_reason = null, provider_id = v_provider
  where id = a.id;
  return v_provider;
end;
$$;

-- --- admin_reject_application : refus motivé (le demandeur peut renvoyer) -------
create or replace function public.admin_reject_application(p_application_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if coalesce(btrim(p_reason), '') = '' then raise exception 'reason_required'; end if;
  update public.provider_applications
  set status = 'rejected', decided_at = now(), decided_by = auth.uid(),
      rejection_reason = btrim(p_reason)
  where id = p_application_id and status = 'submitted';
  if not found then raise exception 'application_not_pending'; end if;
end;
$$;

-- --- Droits d'exécution --------------------------------------------------------
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.rbq_check_licence(text, text) from public, anon, authenticated;
revoke execute on function public.submit_provider_application(
  text, text[], text, text, numeric, text, text, text) from public, anon;
revoke execute on function public.admin_approve_application(uuid) from public, anon;
revoke execute on function public.admin_reject_application(uuid, text) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.submit_provider_application(
  text, text[], text, text, numeric, text, text, text) to authenticated;
-- Exécutables par tout compte connecté, mais refusés sans is_admin() (vérifié dedans).
grant execute on function public.admin_approve_application(uuid) to authenticated;
grant execute on function public.admin_reject_application(uuid, text) to authenticated;
