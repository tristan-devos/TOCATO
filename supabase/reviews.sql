-- =============================================================================
-- TOCATO : fin de mission (à exécuter APRÈS quotes.sql, AVANT applications.sql)
-- =============================================================================
-- docs/devis-et-fin-de-mission.md §6 :
--  - Note du prestataire : à la fin (complete_job, providers.sql), une carte
--    `review_request` arrive dans la conversation ; le client note de 1 à 5 étoiles
--    (submit_review), une fois, dans les 30 jours. La fiche est recalculée.
--  - Conversation fermée : conversation_open dit si l'on peut encore y écrire ; les
--    policies d'insertion des messages (policies.sql) l'appliquent.
-- Idempotent, ré-exécutable.
-- =============================================================================

-- --- reviews : une note par intervention, non modifiable -----------------------
create table if not exists public.reviews (
  booking_id  uuid primary key references public.bookings (id) on delete cascade,
  provider_id text not null references public.providers (id) on delete cascade,
  client_id   uuid not null references public.profiles (id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text not null default '' check (length(comment) <= 500),
  created_at  timestamptz not null default now()
);

-- Délais (lus par l'app : ne pas les changer sans elle, voir lib/conversation-state.ts).
create or replace function public.review_window() returns interval
language sql immutable as $$ select interval '30 days' $$;
create or replace function public.chat_grace() returns interval
language sql immutable as $$ select interval '48 hours' $$;

-- --- conversation_open : peut-on encore écrire dans cette conversation ? ---------
-- Demande ouverte : chaque prestataire intéressé. Après l'accord : le prestataire
-- retenu seulement, jusqu'à 48 h après la fin. Annulée : personne. Security definer :
-- un prestataire ne lit pas la ligne bookings d'une demande ouverte (RLS).
create or replace function public.conversation_open(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select case
      when b.status = 'pending' then true
      when b.provider_id is distinct from c.provider_id then false
      when b.status in ('confirmed', 'in_progress') then true
      when b.status = 'completed' then
        b.completed_at is not null and b.completed_at > now() - public.chat_grace()
      else false
    end
    from public.conversations c
    join public.bookings b on b.id = c.booking_id
    where c.id = p_conversation_id
  ), false);
$$;

-- --- submit_review : le client note le prestataire retenu -----------------------
create or replace function public.submit_review(
  p_booking_id uuid,
  p_rating     integer,
  p_comment    text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_rating is null or p_rating not between 1 and 5 then raise exception 'invalid_rating'; end if;
  if length(coalesce(p_comment, '')) > 500 then raise exception 'comment_too_long'; end if;

  select * into v_booking from public.bookings
  where id = p_booking_id and user_id = auth.uid() and status = 'completed'
    and provider_id is not null
  for update;
  if not found then raise exception 'booking_not_completed'; end if;
  if v_booking.completed_at is null or v_booking.completed_at < now() - public.review_window() then
    raise exception 'review_window_closed';
  end if;
  if exists (select 1 from public.reviews where booking_id = p_booking_id) then
    raise exception 'already_reviewed';
  end if;

  insert into public.reviews (booking_id, provider_id, client_id, rating, comment)
  values (p_booking_id, v_booking.provider_id, auth.uid(), p_rating, coalesce(btrim(p_comment), ''));

  -- Fiche recalculée dans la même transaction (moyenne à une décimale).
  update public.providers p
  set rating = coalesce((select round(avg(r.rating), 1) from public.reviews r
                         where r.provider_id = p.id), 0),
      review_count = (select count(*) from public.reviews r where r.provider_id = p.id)
  where p.id = v_booking.provider_id;
end;
$$;

-- --- Droits d'exécution --------------------------------------------------------
revoke execute on function public.conversation_open(uuid) from public, anon;
revoke execute on function public.submit_review(uuid, integer, text) from public, anon;
grant execute on function public.conversation_open(uuid) to authenticated;
grant execute on function public.submit_review(uuid, integer, text) to authenticated;
