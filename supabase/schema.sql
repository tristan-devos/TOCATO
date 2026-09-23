-- =============================================================================
-- TOCATO — schéma Postgres (Supabase)
-- =============================================================================
-- Miroir de src/lib/types.ts (source de vérité du domaine) et de
-- src/lib/database.types.ts. Appliqué par supabase/apply.sh (ou le SQL editor).
-- Idempotent autant que possible (IF NOT EXISTS / ON CONFLICT).
--
-- Ordre d'exécution (tous idempotents) : schema.sql (tables, migrations, seed)
-- -> rpc.sql -> transitions.sql -> providers.sql -> policies.sql (RLS + Storage,
-- en dernier car les policies appellent les fonctions des fichiers précédents).
-- Écritures sur bookings / conversations / messages : uniquement via les RPC,
-- sauf l'envoi d'un message texte (voir policies.sql).
-- =============================================================================

-- ——— profiles : 1:1 avec auth.users ———————————————————————————————————————
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

-- ——— addresses ———————————————————————————————————————————————————————————
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

-- ——— providers : catalogue, lecture publique ——————————————————————————————
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
  -- admin_link_provider (providers.sql). Null pour les fiches de démo.
  user_id        uuid unique references public.profiles (id) on delete set null,
  -- Fiche de démo : répond via la simulation (Edge Function provider-reply).
  is_demo        boolean not null default false,
  constraint providers_services_valid
    check (services <@ array['plumber', 'mover', 'gardener']::text[])
);
alter table public.providers
  add column if not exists user_id uuid unique references public.profiles (id) on delete set null;
alter table public.providers add column if not exists is_demo boolean not null default false;

-- ——— bookings ————————————————————————————————————————————————————————————
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
  provider_id     text references public.providers (id)
);
create index if not exists bookings_user_id_idx on public.bookings (user_id);
-- Migration des bases déjà déployées : photo_count (entier) -> photos (chemins Storage).
alter table public.bookings add column if not exists photos text[] not null default '{}';
alter table public.bookings drop column if exists photo_count;

-- ——— conversations ———————————————————————————————————————————————————————
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

-- ——— messages ————————————————————————————————————————————————————————————
-- sender_kind remplace le `senderId` magique ('me') du domaine.
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_kind     text not null check (sender_kind in ('client', 'provider', 'system')),
  provider_id     text references public.providers (id),
  type            text not null check (type in ('text', 'quote', 'document', 'system')),
  text            text not null default '',
  created_at      timestamptz not null default now(),
  quote           jsonb,
  document        jsonb,
  -- Messages système : clé traduite par l'app selon la langue ET le rôle de celui
  -- qui lit (« Vous avez refusé le devis » / « Le client a refusé votre devis »).
  -- `text` garde la version française côté client (anciennes versions de l'app).
  system_key      text
);
create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
alter table public.messages add column if not exists system_key text;
alter table public.messages drop constraint if exists messages_system_key_valid;
alter table public.messages add constraint messages_system_key_valid check (
  system_key in ('quoteAccepted', 'otherProviderChosen', 'quoteDeclined', 'bookingCancelled', 'jobStarted', 'jobCompleted')
);
-- Migration : clé retrouvée d'après le texte des messages système déjà en base.
update public.messages set system_key = case text
    when 'Devis accepté — votre réservation est confirmée.' then 'quoteAccepted'
    when 'Vous avez confirmé un autre prestataire pour cette demande.' then 'otherProviderChosen'
    when 'Vous avez refusé le devis.' then 'quoteDeclined'
    when 'Vous avez annulé cette réservation.' then 'bookingCancelled'
    when 'Le prestataire a commencé l''intervention.' then 'jobStarted'
    when 'Intervention terminée.' then 'jobCompleted'
  end
where sender_kind = 'system' and system_key is null;

-- =============================================================================
-- Realtime : le client s'abonne aux changements (messages, bookings,
-- conversations). Idempotent — n'ajoute la table que si absente de la publication.
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
-- Seed des fiches prestataires de démo (lues par l'app via providers-store)
-- =============================================================================
insert into public.providers
  (id, name, services, rating, review_count, jobs_completed, verified,
   response_time, hourly_rate, bio, member_since)
values
  ('p-marc', 'Marc Tremblay', array['plumber'], 4.9, 127, 340, true,
   'Répond en ~15 min', 95,
   'Plombier certifié CMMTQ, 12 ans d''expérience sur le Plateau et Rosemont. Urgences acceptées.',
   '2021'),
  ('p-amadou', 'Amadou Diallo', array['plumber'], 4.8, 89, 210, true,
   'Répond en ~30 min', 90,
   'Spécialiste débouchage et chauffe-eau. Travail propre, devis clair avant chaque intervention.',
   '2022'),
  ('p-jp', 'Jean-Philippe Côté', array['mover'], 4.7, 203, 480, true,
   'Répond en ~1 h', 120,
   'Équipe de 2 à 4 déménageurs, camion 20 pieds. Habitués des escaliers en colimaçon montréalais.',
   '2020'),
  ('p-kevin', 'Kevin Nguyen', array['mover'], 4.9, 156, 320, true,
   'Répond en ~20 min', 115,
   'Déménagement résidentiel et petit commercial. Couvertures, sangles et diable fournis.',
   '2021'),
  ('p-sophie', 'Sophie Gagnon', array['gardener'], 5.0, 78, 190, true,
   'Répond en ~45 min', 55,
   'Horticultrice passionnée. Entretien écologique, sans pesticides. Rosemont, Villeray et alentours.',
   '2022'),
  ('p-maria', 'Maria Fernandez', array['gardener'], 4.8, 112, 260, false,
   'Répond en ~2 h', 60,
   'Aménagement paysager et entretien saisonnier. Devis gratuit sur photos.',
   '2023')
on conflict (id) do nothing;
-- Les six fiches ci-dessus sont des fiches de démo (simulation provider-reply).
update public.providers set is_demo = true
where id in ('p-marc', 'p-amadou', 'p-jp', 'p-kevin', 'p-sophie', 'p-maria') and not is_demo;
