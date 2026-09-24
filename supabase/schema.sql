-- =============================================================================
-- TOCATO : schéma Postgres (Supabase)
-- =============================================================================
-- Miroir de src/lib/types.ts (source de vérité du domaine) et de
-- src/lib/database.types.ts. Appliqué par supabase/apply.sh (ou le SQL editor).
-- Idempotent autant que possible (IF NOT EXISTS / ON CONFLICT).
--
-- Ordre d'exécution (tous idempotents) : schema.sql (tables, migrations, Storage)
-- -> rpc.sql -> transitions.sql -> providers.sql -> quotes.sql -> applications.sql -> photos.sql
-- -> admin.sql -> policies.sql (RLS + Storage, en dernier car les policies appellent
-- les fonctions des fichiers précédents).
-- Écritures sur bookings / conversations / messages : uniquement via les RPC,
-- sauf l'envoi d'un message texte (voir policies.sql).
-- =============================================================================

-- --- profiles : 1:1 avec auth.users ---------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  email      text not null,
  phone      text not null default '',
  created_at timestamptz not null default now()
);

-- Crée automatiquement le profil à l'inscription (nom lu dans les métadonnées).
-- Email/mot de passe fournit 'name' ; les fournisseurs OAuth (Google) renseignent
-- 'name' ou 'full_name'. À défaut, on retombe sur la partie locale du courriel.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, ''), '@', 1),
      ''
    ),
    coalesce(new.email, '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- addresses -----------------------------------------------------------
create table if not exists public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  label       text not null,
  street      text not null,
  city        text not null,
  postal_code text not null,
  created_at  timestamptz not null default now()
);
create index if not exists addresses_user_id_idx on public.addresses (user_id);

-- --- providers : catalogue, lecture publique ------------------------------
create table if not exists public.providers (
  id             text primary key,
  name           text not null,
  services       text[] not null default '{}',
  rating         numeric(2, 1) not null default 0,
  review_count   integer not null default 0,
  jobs_completed integer not null default 0,
  verified       boolean not null default false,
  response_time  text not null default '',
  hourly_rate    numeric(10, 2) not null default 0,
  bio            text not null default '',
  member_since   text not null default '',
  -- Compte relié (prestataire réel), renseigné par un admin via
  -- admin_link_provider (providers.sql). Null tant que la fiche n'est reliée à aucun compte.
  user_id        uuid unique references public.profiles (id) on delete set null,
  -- Photo publiée (bucket privé provider-photos, {user_id}/{uuid}.jpg), validée par
  -- l'admin : à l'adhésion, puis à chaque changement (photos.sql). Null = initiales.
  photo_path     text,
  constraint providers_services_valid
    check (services <@ array['plumber', 'mover', 'gardener']::text[])
);
alter table public.providers
  add column if not exists user_id uuid unique references public.profiles (id) on delete set null;
alter table public.providers add column if not exists photo_path text;

-- --- bookings ------------------------------------------------------------
-- Appel d'offres : provider_id est null tant qu'aucun devis n'est accepté. Les
-- prestataires intéressés ouvrent chacun une conversation (conversations.booking_id,
-- N par demande) ; accept_quote fixe le prestataire.
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  service_id      text not null check (service_id in ('plumber', 'mover', 'gardener')),
  status          text not null default 'pending'
    check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at      timestamptz not null default now(),
  scheduled_date  date,
  time_slot       text check (time_slot in ('morning', 'afternoon', 'evening')),
  address         jsonb not null,
  answers         jsonb not null default '[]'::jsonb,
  description     text not null default '',
  -- Chemins Storage des photos jointes (bucket booking-photos), {user}/{booking}/{n}.jpg.
  photos          text[] not null default '{}',
  estimate_min    numeric(10, 2) not null,
  estimate_max    numeric(10, 2) not null,
  agreed_price    numeric(10, 2),
  provider_id     text references public.providers (id),
  -- Fin de l'intervention, posée par complete_job : « terminé ce mois-ci » du tableau
  -- de bord prestataire. Null pour les missions terminées avant son ajout.
  completed_at    timestamptz
);
create index if not exists bookings_user_id_idx on public.bookings (user_id);
-- Migration des bases déjà déployées : photo_count (entier) -> photos (chemins Storage).
alter table public.bookings add column if not exists photos text[] not null default '{}';
alter table public.bookings add column if not exists completed_at timestamptz;
alter table public.bookings drop column if exists photo_count;

-- --- conversations -------------------------------------------------------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  provider_id     text not null references public.providers (id),
  booking_id      uuid not null references public.bookings (id) on delete cascade,
  -- Non-lus de chaque côté : le trigger handle_new_message incrémente le compteur
  -- du destinataire, mark_conversation_read remet à zéro celui de l'appelant.
  client_unread_count   integer not null default 0,
  provider_unread_count integer not null default 0,
  last_message_at timestamptz not null default now()
);
-- Migration : l'ancien compteur unique (côté client) devient client_unread_count.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public'
             and table_name = 'conversations' and column_name = 'unread_count') then
    alter table public.conversations rename column unread_count to client_unread_count;
  end if;
end $$;
alter table public.conversations
  add column if not exists provider_unread_count integer not null default 0;
create index if not exists conversations_user_id_idx on public.conversations (user_id);
create index if not exists conversations_provider_id_idx on public.conversations (provider_id);
-- Migration des bases déjà déployées vers l'appel d'offres : le prestataire n'est
-- plus fixé à la création, et une demande a N conversations au lieu d'une seule.
-- (Remplace la réparation temporaire de conversation_id du 2026-09-23.)
alter table public.bookings alter column provider_id drop not null;
alter table public.bookings drop column if exists conversation_id;
-- Demandes encore en attente créées avec l'ancien modèle : le prestataire y était
-- fixé d'avance. Dans l'appel d'offres il ne l'est qu'à l'acceptation (accept_quote
-- l'exige null) ; on le libère pour que leurs devis restent acceptables.
update public.bookings set provider_id = null where status = 'pending' and provider_id is not null;
-- Un prestataire n'ouvre qu'une conversation par demande.
create unique index if not exists conversations_booking_provider_key
  on public.conversations (booking_id, provider_id);

-- --- messages ------------------------------------------------------------
-- sender_kind remplace le `senderId` magique ('me') du domaine.
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_kind     text not null check (sender_kind in ('client', 'provider', 'system')),
  provider_id     text references public.providers (id),
  type            text not null
    check (type in ('text', 'quote', 'document', 'system', 'reschedule')),
  text            text not null default '',
  created_at      timestamptz not null default now(),
  quote           jsonb,
  document        jsonb,
  -- Nouvelle date proposée par le prestataire retenu (quotes.sql, propose_reschedule) :
  -- {date, slot, reason, previous_date, previous_slot, status}.
  reschedule      jsonb,
  -- Messages système : clé traduite par l'app selon la langue ET le rôle de celui
  -- qui lit (« Vous avez refusé le devis » / « Le client a refusé votre devis »).
  -- `text` garde la version française côté client (anciennes versions de l'app).
  system_key      text
);
create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
alter table public.messages add column if not exists system_key text;
-- Migration (changement de date) : colonne et type de message.
alter table public.messages add column if not exists reschedule jsonb;
alter table public.messages drop constraint if exists messages_type_check;
alter table public.messages add constraint messages_type_check
  check (type in ('text', 'quote', 'document', 'system', 'reschedule'));
alter table public.messages drop constraint if exists messages_system_key_valid;
alter table public.messages add constraint messages_system_key_valid check (
  system_key in ('quoteAccepted', 'otherProviderChosen', 'quoteDeclined', 'bookingCancelled',
                 'jobStarted', 'jobCompleted', 'rescheduleAccepted', 'rescheduleDeclined')
);
-- Migration : clé retrouvée d'après le texte des messages système déjà en base.
update public.messages set system_key = case text
    when 'Devis accepté — votre réservation est confirmée.' then 'quoteAccepted'  -- texte historique exact, ne pas modifier
    when 'Vous avez confirmé un autre prestataire pour cette demande.' then 'otherProviderChosen'
    when 'Vous avez refusé le devis.' then 'quoteDeclined'
    when 'Vous avez annulé cette réservation.' then 'bookingCancelled'
    when 'Le prestataire a commencé l''intervention.' then 'jobStarted'
    when 'Intervention terminée.' then 'jobCompleted'
  end
where sender_kind = 'system' and system_key is null;

-- =============================================================================
-- Realtime : le client s'abonne aux changements (messages, bookings,
-- conversations). Idempotent : n'ajoute la table que si absente de la publication.
-- =============================================================================
do $$
declare
  t text;
begin
  foreach t in array array['messages', 'bookings', 'conversations'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- =============================================================================
-- Storage : photos jointes aux demandes de réservation (bucket privé).
-- Chemin : {user_id}/{booking_id}/{n}.jpg. Policies d'accès : voir policies.sql.
-- L'app lit via URLs signées (createSignedUrls), jamais en accès public.
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('booking-photos', 'booking-photos', false)
on conflict (id) do nothing;


-- =============================================================================
-- Migration (lot 5) : fin de la simulation, suppression des fiches de démo
-- =============================================================================
-- Les six fiches is_demo (Marc, Amadou…) répondaient via l'Edge Function
-- provider-reply, supprimée. On efface leurs données puis la colonne. Ne tourne
-- qu'une fois : ensuite la colonne n'existe plus (plpgsql n'analyse les requêtes
-- qu'à l'exécution, le bloc reste valide sur une base déjà migrée).
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public'
             and table_name = 'providers' and column_name = 'is_demo') then
    -- Réservations qui ne tiennent qu'aux fiches de démo : retenue par l'une d'elles,
    -- ou avec des offres de démo et aucune d'un vrai prestataire. Cascade :
    -- conversations et messages. Les photos Storage restent (fichiers orphelins).
    delete from public.bookings b
    where b.provider_id in (select id from public.providers where is_demo)
       or (exists (select 1 from public.conversations c join public.providers p on p.id = c.provider_id
                   where c.booking_id = b.id and p.is_demo)
           and not exists (select 1 from public.conversations c join public.providers p on p.id = c.provider_id
                           where c.booking_id = b.id and not p.is_demo));
    -- Offres de démo restantes sur des demandes gardées (cascade : leurs messages).
    delete from public.conversations
    where provider_id in (select id from public.providers where is_demo);
    delete from public.providers where is_demo;
    alter table public.providers drop column is_demo;
  end if;
end $$;
