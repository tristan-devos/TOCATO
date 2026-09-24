-- =============================================================================
-- TOCATO : actions de l'admin (à exécuter APRÈS photos.sql, AVANT policies.sql)
-- =============================================================================
-- Adhésions (approuver, refuser, lire les demandeurs et l'état du registre RBQ) et
-- photos des prestataires (valider ou refuser un changement). Toutes accordées à
-- `authenticated` mais refusées sans is_admin() (vérifié dans chaque fonction).
-- Voir docs/adhesion-prestataires.md et docs/experience-emotionnelle.md §5.
-- Idempotent, ré-exécutable.
-- =============================================================================

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
  -- La photo de la demande devient la photo publiée (null pour une demande antérieure
  -- aux photos : initiales en repli).
  insert into public.providers (id, name, services, hourly_rate, bio, member_since, verified,
                                user_id, photo_path)
  values (v_provider, a.business_name, a.services, a.hourly_rate, a.bio,
          extract(year from now())::text, true, a.user_id, a.photo_path);

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

-- --- Lectures de l'admin (écran « Adhésions ») ------------------------------
-- Nom et courriel des demandeurs : profiles n'est lisible que par son propriétaire.
create or replace function public.admin_list_applicants()
returns table (applicant_id uuid, applicant_name text, applicant_email text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query
    select p.id, p.name, p.email
    from public.profiles p
    join public.provider_applications a on a.user_id = p.id;
end;
$$;

-- Fraîcheur du registre RBQ (dernier import, nombre de licences) : alerte si l'import
-- nocturne échoue plusieurs nuits de suite.
create or replace function public.admin_rbq_registry_status()
returns table (last_import timestamptz, licence_count bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  return query select max(r.imported_at), count(*) from public.rbq_licences r;
end;
$$;

-- --- admin_approve_photo : publie la photo proposée par un prestataire ----------
create or replace function public.admin_approve_photo(p_provider_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  delete from public.provider_photo_changes
  where provider_id = p_provider_id and status = 'submitted'
  returning photo_path into v_path;
  if v_path is null then raise exception 'photo_not_pending'; end if;
  -- L'ancienne photo n'est plus référencée : effacée par purge-documents.
  update public.providers set photo_path = v_path where id = p_provider_id;
end;
$$;

-- --- admin_reject_photo : refus motivé (la photo publiée reste en place) --------
create or replace function public.admin_reject_photo(p_provider_id text, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'not_admin'; end if;
  if coalesce(btrim(p_reason), '') = '' then raise exception 'reason_required'; end if;
  update public.provider_photo_changes
  set status = 'rejected', decided_at = now(), rejection_reason = btrim(p_reason)
  where provider_id = p_provider_id and status = 'submitted';
  if not found then raise exception 'photo_not_pending'; end if;
end;
$$;

-- --- Droits d'exécution --------------------------------------------------------
revoke execute on function public.admin_approve_application(uuid) from public, anon;
revoke execute on function public.admin_reject_application(uuid, text) from public, anon;
revoke execute on function public.admin_list_applicants() from public, anon;
revoke execute on function public.admin_rbq_registry_status() from public, anon;
revoke execute on function public.admin_approve_photo(text) from public, anon;
revoke execute on function public.admin_reject_photo(text, text) from public, anon;
grant execute on function public.admin_approve_application(uuid) to authenticated;
grant execute on function public.admin_reject_application(uuid, text) to authenticated;
grant execute on function public.admin_list_applicants() to authenticated;
grant execute on function public.admin_rbq_registry_status() to authenticated;
grant execute on function public.admin_approve_photo(text) to authenticated;
grant execute on function public.admin_reject_photo(text, text) to authenticated;
