-- =============================================================================
-- TOCATO : photos des prestataires (à exécuter APRÈS applications.sql, AVANT admin.sql)
-- =============================================================================
-- Une photo n'est publiée (providers.photo_path) qu'après validation de l'admin :
--  - à l'adhésion : provider_applications.photo_path, recopiée à l'approbation ;
--  - ensuite, à chaque changement : provider_photo_changes (une ligne par fiche),
--    validée ou refusée par admin_approve_photo / admin_reject_photo (admin.sql).
-- Bucket privé provider-photos, chemin {user_id}/{uuid}.jpg (un nouveau nom à chaque
-- envoi : aucun cache périmé chez les clients). Lecture (policies.sql) : une photo
-- publiée par tout compte connecté ; les autres par leur propriétaire et l'admin.
-- Voir docs/experience-emotionnelle.md §5. Idempotent, ré-exécutable.
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('provider-photos', 'provider-photos', false)
on conflict (id) do nothing;

-- --- provider_photo_changes : photo proposée par un prestataire déjà approuvé ----
-- Table à part plutôt qu'une colonne de providers : providers est lisible par tous
-- les comptes connectés, une photo en attente (et le motif d'un refus) ne regarde que
-- le prestataire et l'admin.
create table if not exists public.provider_photo_changes (
  provider_id      text primary key references public.providers (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  status           text not null default 'submitted' check (status in ('submitted', 'rejected')),
  photo_path       text not null,
  submitted_at     timestamptz not null default now(),
  decided_at       timestamptz,
  rejection_reason text
);

-- --- provider_photo_visible : règle de lecture du bucket (policies.sql) ---------
-- Security definer : la policy ne dépend pas de la RLS des tables consultées.
create or replace function public.provider_photo_visible(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select split_part(p_name, '/', 1) = auth.uid()::text
      or public.is_admin()
      or exists (select 1 from public.providers where photo_path = p_name);
$$;

-- --- submit_provider_photo : un prestataire propose une nouvelle photo -----------
-- Remplace une proposition en attente ou refusée. La photo publiée reste en place
-- jusqu'à la validation.
create or replace function public.submit_provider_photo(p_photo_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_provider text := public.current_provider_id();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if v_provider is null then raise exception 'not_provider'; end if;
  if split_part(coalesce(p_photo_path, ''), '/', 1) <> v_uid::text then
    raise exception 'invalid_photo_path';
  end if;

  insert into public.provider_photo_changes as c (provider_id, user_id, status, photo_path)
  values (v_provider, v_uid, 'submitted', p_photo_path)
  on conflict (provider_id) do update set
    status = 'submitted', photo_path = excluded.photo_path, submitted_at = now(),
    decided_at = null, rejection_reason = null;
end;
$$;

-- --- Droits d'exécution --------------------------------------------------------
revoke execute on function public.provider_photo_visible(text) from public, anon;
revoke execute on function public.submit_provider_photo(text) from public, anon;
grant execute on function public.provider_photo_visible(text) to authenticated;
grant execute on function public.submit_provider_photo(text) to authenticated;
