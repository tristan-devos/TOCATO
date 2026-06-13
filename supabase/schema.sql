-- =============================================================================
-- TOCATO — schéma Postgres (Supabase)
-- =============================================================================
-- Miroir de src/lib/types.ts (source de vérité du domaine) et de
-- src/lib/database.types.ts. À exécuter dans le SQL editor d'un projet Supabase.
-- Idempotent autant que possible (IF NOT EXISTS / ON CONFLICT).
--
-- Modèle : une app côté client. Chaque utilisateur ne voit que ses propres
-- données (RLS owner-only). Le catalogue `providers` est en lecture publique.
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
    coalesce(new.raw_user_meta_data ->> 'name', ''),
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
  constraint providers_services_valid
    check (services <@ array['plumber', 'mover', 'gardener']::text[])
);

-- ——— bookings ————————————————————————————————————————————————————————————
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
  photo_count     integer not null default 0,
  estimate_min    numeric(10, 2) not null,
  estimate_max    numeric(10, 2) not null,
  agreed_price    numeric(10, 2),
  provider_id     text not null references public.providers (id),
  conversation_id uuid not null
);
create index if not exists bookings_user_id_idx on public.bookings (user_id);

-- ——— conversations ———————————————————————————————————————————————————————
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  provider_id     text not null references public.providers (id),
  booking_id      uuid not null references public.bookings (id) on delete cascade,
  unread_count    integer not null default 0,
  last_message_at timestamptz not null default now()
);
create index if not exists conversations_user_id_idx on public.conversations (user_id);

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
  document        jsonb
);
create index if not exists messages_conversation_id_idx on public.messages (conversation_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles      enable row level security;
alter table public.addresses     enable row level security;
alter table public.providers     enable row level security;
alter table public.bookings      enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

-- profiles : chacun gère son propre profil.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
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
  for select using (true);

-- bookings : owner-only.
drop policy if exists "bookings_all_own" on public.bookings;
create policy "bookings_all_own" on public.bookings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- conversations : owner-only.
drop policy if exists "conversations_all_own" on public.conversations;
create policy "conversations_all_own" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- messages : accès via la conversation possédée par l'utilisateur.
drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );
drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );
drop policy if exists "messages_update_own" on public.messages;
create policy "messages_update_own" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.user_id = auth.uid()
    )
  );

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
-- Seed du catalogue prestataires (miroir de src/lib/mock-data.ts)
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
