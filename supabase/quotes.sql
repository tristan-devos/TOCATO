-- =============================================================================
-- TOCATO : devis (à exécuter APRÈS providers.sql, AVANT reviews.sql)
-- =============================================================================
-- Fiche devis complète (docs/devis-et-fin-de-mission.md §4) : lignes chiffrées, total
-- calculé ici (jamais envoyé par l'app), durée estimée, date et créneau proposés,
-- garantie, ce qui est inclus. Accepter le devis (accept_quote, transitions.sql)
-- recopie la date et le créneau sur la réservation. Changement de date ensuite :
-- propose_reschedule (prestataire retenu) puis respond_reschedule (client), §5.
--
-- Stockage : messages.quote (jsonb), clés en snake_case :
--   amount, details (ce qui est inclus), status, lines [{label, category, amount}],
--   proposed_date (YYYY-MM-DD), proposed_slot, duration_hours, warranty.
-- Les anciens devis n'ont que amount, details, status : l'app les affiche toujours.
-- Idempotent, ré-exécutable.
-- =============================================================================

-- Migration : l'ancienne signature (montant + détails) disparaît.
drop function if exists public.send_quote(uuid, numeric, text);

-- Date du jour à Montréal (la base tourne en UTC : après 20 h, UTC est déjà demain).
create or replace function public.montreal_today()
returns date
language sql
stable
as $$ select (now() at time zone 'America/Montreal')::date $$;

-- --- quote_total : valide les lignes d'un devis et renvoie leur total -------------
-- 1 à 10 lignes {label (1 à 80 car.), category, amount > 0} ; total <= 100 000 $.
create or replace function public.quote_total(p_lines jsonb)
returns numeric
language plpgsql
immutable
as $$
declare
  v_line  jsonb;
  v_total numeric := 0;
  v_amount numeric;
begin
  if jsonb_typeof(p_lines) is distinct from 'array'
     or jsonb_array_length(p_lines) not between 1 and 10 then
    raise exception 'invalid_lines';
  end if;
  for v_line in select * from jsonb_array_elements(p_lines) loop
    if jsonb_typeof(v_line) <> 'object'
       or length(btrim(coalesce(v_line ->> 'label', ''))) not between 1 and 80
       or coalesce(v_line ->> 'category', '') not in ('labor', 'parts', 'travel', 'other')
       or jsonb_typeof(v_line -> 'amount') is distinct from 'number' then
      raise exception 'invalid_lines';
    end if;
    v_amount := (v_line ->> 'amount')::numeric;
    if v_amount <= 0 then raise exception 'invalid_lines'; end if;
    v_total := v_total + v_amount;
  end loop;
  if v_total > 100000 then raise exception 'invalid_amount'; end if;
  return v_total;
end;
$$;

-- --- send_quote : le prestataire envoie un devis sur une demande ouverte --------
-- Ouvre sa conversation si besoin (une par demande et par prestataire). Refuse s'il
-- a déjà un devis en attente sur cette demande. Renvoie la conversation.
create or replace function public.send_quote(
  p_booking_id     uuid,
  p_lines          jsonb,
  p_proposed_date  date,
  p_proposed_slot  text,
  p_duration_hours numeric,
  p_included       text,
  p_warranty       text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider     text := public.current_provider_id();
  v_client       uuid;
  v_conversation uuid;
  v_total        numeric;
  v_lines        jsonb;
begin
  if v_provider is null then raise exception 'not_a_provider'; end if;
  v_total := public.quote_total(p_lines);
  if p_proposed_date is null
     or p_proposed_date < public.montreal_today()
     or p_proposed_date > public.montreal_today() + 60 then
    raise exception 'invalid_date';
  end if;
  if coalesce(p_proposed_slot, '') not in ('morning', 'afternoon', 'evening') then
    raise exception 'invalid_slot';
  end if;
  if p_duration_hours is null or p_duration_hours < 0.5 or p_duration_hours > 24 then
    raise exception 'invalid_duration';
  end if;
  if length(coalesce(p_included, '')) > 2000 then raise exception 'details_too_long'; end if;
  if length(coalesce(p_warranty, '')) > 200 then raise exception 'warranty_too_long'; end if;

  select b.user_id into v_client
  from public.bookings b
  join public.providers p on p.id = v_provider
  where b.id = p_booking_id
    and b.status = 'pending'
    and b.provider_id is null
    and b.service_id = any (p.services)
  for update of b;
  if not found then raise exception 'booking_not_open'; end if;

  insert into public.conversations (user_id, provider_id, booking_id)
  values (v_client, v_provider, p_booking_id)
  on conflict (booking_id, provider_id) do nothing;
  select id into v_conversation from public.conversations
  where booking_id = p_booking_id and provider_id = v_provider;

  if exists (
    select 1 from public.messages
    where conversation_id = v_conversation and type = 'quote'
      and quote ->> 'status' = 'pending'
  ) then
    raise exception 'quote_already_pending';
  end if;

  -- Lignes normalisées : on ne garde que les clés connues, libellés nettoyés.
  select jsonb_agg(jsonb_build_object(
           'label', btrim(l ->> 'label'),
           'category', l ->> 'category',
           'amount', (l ->> 'amount')::numeric))
    into v_lines
  from jsonb_array_elements(p_lines) l;

  insert into public.messages (conversation_id, sender_kind, provider_id, type, text, quote)
  -- Pas de texte : la carte de devis s'affiche seule, dans la langue de chacun.
  values (v_conversation, 'provider', v_provider, 'quote', '',
          jsonb_build_object(
            'amount', v_total,
            'details', coalesce(btrim(p_included), ''),
            'status', 'pending',
            'lines', v_lines,
            'proposed_date', p_proposed_date,
            'proposed_slot', p_proposed_slot,
            'duration_hours', p_duration_hours,
            'warranty', coalesce(btrim(p_warranty), '')));
  return v_conversation;
end;
$$;

-- --- propose_reschedule : le prestataire retenu propose une autre date ------------
-- Mission confirmée (pas encore commencée), une seule proposition en attente. Carte
-- `reschedule` dans la conversation ; la date de la mission ne change qu'à l'accord.
create or replace function public.propose_reschedule(
  p_booking_id uuid,
  p_date       date,
  p_slot       text,
  p_reason     text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider     text := public.current_provider_id();
  v_booking      public.bookings;
  v_conversation uuid;
  v_message      uuid;
begin
  if v_provider is null then raise exception 'not_a_provider'; end if;
  select * into v_booking from public.bookings
  where id = p_booking_id and provider_id = v_provider and status = 'confirmed'
  for update;
  if not found then raise exception 'booking_not_confirmed'; end if;
  if p_date is null or p_date < public.montreal_today() or p_date > public.montreal_today() + 60 then
    raise exception 'invalid_date';
  end if;
  if coalesce(p_slot, '') not in ('morning', 'afternoon', 'evening') then
    raise exception 'invalid_slot';
  end if;
  if p_date = v_booking.scheduled_date and p_slot = v_booking.time_slot then
    raise exception 'same_date';
  end if;
  if length(coalesce(p_reason, '')) > 300 then raise exception 'reason_too_long'; end if;

  select id into v_conversation from public.conversations
  where booking_id = p_booking_id and provider_id = v_provider;
  if v_conversation is null then raise exception 'booking_not_confirmed'; end if;
  if exists (
    select 1 from public.messages
    where conversation_id = v_conversation and type = 'reschedule'
      and reschedule ->> 'status' = 'pending'
  ) then
    raise exception 'reschedule_already_pending';
  end if;

  insert into public.messages (conversation_id, sender_kind, provider_id, type, text, reschedule)
  values (v_conversation, 'provider', v_provider, 'reschedule', '',
          jsonb_build_object(
            'date', p_date, 'slot', p_slot, 'reason', coalesce(btrim(p_reason), ''),
            'previous_date', v_booking.scheduled_date, 'previous_slot', v_booking.time_slot,
            'status', 'pending'))
  returning id into v_message;
  return v_message;
end;
$$;

-- --- respond_reschedule : le client accepte (nouvelle date) ou refuse ------------
create or replace function public.respond_reschedule(p_message_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation uuid;
  v_booking      uuid;
  v_date         date;
  v_slot         text;
begin
  select m.conversation_id, c.booking_id, (m.reschedule ->> 'date')::date,
         m.reschedule ->> 'slot'
    into v_conversation, v_booking, v_date, v_slot
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where m.id = p_message_id
    and m.type = 'reschedule'
    and m.reschedule ->> 'status' = 'pending'
    and c.user_id = auth.uid()
  for update of m;
  if not found then raise exception 'reschedule_not_pending'; end if;

  -- Mission toujours confirmée (ni commencée, ni annulée) et à ce prestataire.
  perform 1 from public.bookings b
  join public.conversations c on c.id = v_conversation
  where b.id = v_booking and b.status = 'confirmed' and b.provider_id = c.provider_id
  for update of b;
  if not found then raise exception 'booking_not_confirmed'; end if;

  update public.messages
  set reschedule = jsonb_set(reschedule, '{status}',
                             to_jsonb(case when p_accept then 'accepted' else 'declined' end))
  where id = p_message_id;

  if p_accept then
    update public.bookings set scheduled_date = v_date, time_slot = v_slot where id = v_booking;
    insert into public.messages (conversation_id, sender_kind, type, text, system_key)
    values (v_conversation, 'system', 'system', 'Nouvelle date acceptée.', 'rescheduleAccepted');
  else
    insert into public.messages (conversation_id, sender_kind, type, text, system_key)
    values (v_conversation, 'system', 'system',
            'Nouvelle date refusée : la date prévue est maintenue.', 'rescheduleDeclined');
  end if;
end;
$$;

-- --- Droits d'exécution --------------------------------------------------------
revoke execute on function public.send_quote(uuid, jsonb, date, text, numeric, text, text)
  from public, anon;
grant execute on function public.send_quote(uuid, jsonb, date, text, numeric, text, text)
  to authenticated;
revoke execute on function public.propose_reschedule(uuid, date, text, text) from public, anon;
revoke execute on function public.respond_reschedule(uuid, boolean) from public, anon;
grant execute on function public.propose_reschedule(uuid, date, text, text) to authenticated;
grant execute on function public.respond_reschedule(uuid, boolean) to authenticated;
