-- =============================================================================
-- TOCATO : transitions d'état (à exécuter APRÈS schema.sql puis rpc.sql)
-- =============================================================================
-- Règle : l'app ne fait AUCUN update direct sur bookings / conversations /
-- messages (les policies d'update sont supprimées dans schema.sql). Toute
-- transition passe par une fonction ci-dessous, qui vérifie QUI appelle
-- (auth.uid()) et SI la transition est permise, puis l'applique atomiquement.
--
-- `security definer` : la fonction s'exécute avec les droits de son
-- propriétaire (RLS contournée) : d'où les vérifications explicites sur
-- auth.uid() (lu dans le JWT, indépendant du rôle d'exécution).
-- Idempotent : `create or replace`, ré-exécutable. Voir docs/interface-prestataire.md §6.
-- =============================================================================

-- --- accept_quote : le client accepte un devis ---------------------------
-- Appel d'offres : devis -> accepted ; réservation -> confirmed + agreed_price +
-- provider_id (le prestataire de ce devis) ; devis concurrents en attente ->
-- declined ; message système dans la conversation retenue ET dans celles des
-- autres prestataires (leurs conversations restent lisibles).
create or replace function public.accept_quote(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation uuid;
  v_booking      uuid;
  v_provider     text;
  v_amount       numeric;
begin
  select m.conversation_id, c.booking_id, c.provider_id, (m.quote ->> 'amount')::numeric
    into v_conversation, v_booking, v_provider, v_amount
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where m.id = p_message_id
    and m.type = 'quote'
    and m.sender_kind = 'provider'
    and m.quote ->> 'status' = 'pending'
    and c.user_id = auth.uid()
  for update of m;
  if not found then raise exception 'quote_not_pending'; end if;

  -- Demande encore ouverte : ni pourvue par un autre prestataire, ni annulée.
  perform 1 from public.bookings
  where id = v_booking and status = 'pending' and provider_id is null
  for update;
  if not found then raise exception 'booking_not_pending'; end if;

  update public.messages
  set quote = jsonb_set(quote, '{status}', '"accepted"')
  where id = p_message_id;

  update public.bookings
  set status = 'confirmed', agreed_price = v_amount, provider_id = v_provider
  where id = v_booking;

  update public.messages m
  set quote = jsonb_set(m.quote, '{status}', '"declined"')
  from public.conversations c
  where c.id = m.conversation_id
    and c.booking_id = v_booking
    and m.type = 'quote'
    and m.quote ->> 'status' = 'pending';

  insert into public.messages (conversation_id, sender_kind, type, text, system_key)
  values (v_conversation, 'system', 'system',
          'Devis accepté. Votre réservation est confirmée.', 'quoteAccepted');

  insert into public.messages (conversation_id, sender_kind, type, text, system_key)
  select c.id, 'system', 'system',
         'Vous avez confirmé un autre prestataire pour cette demande.', 'otherProviderChosen'
  from public.conversations c
  where c.booking_id = v_booking and c.id <> v_conversation;
end;
$$;

-- --- decline_quote : le client refuse un devis -----------------------------
create or replace function public.decline_quote(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation uuid;
begin
  select m.conversation_id into v_conversation
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where m.id = p_message_id
    and m.type = 'quote'
    and m.sender_kind = 'provider'
    and m.quote ->> 'status' = 'pending'
    and c.user_id = auth.uid()
  for update of m;
  if not found then raise exception 'quote_not_pending'; end if;

  update public.messages
  set quote = jsonb_set(quote, '{status}', '"declined"')
  where id = p_message_id;

  insert into public.messages (conversation_id, sender_kind, type, text, system_key)
  values (v_conversation, 'system', 'system', 'Vous avez refusé le devis.', 'quoteDeclined');
end;
$$;

-- --- cancel_booking : le client annule une réservation active ------------
-- Possible tant que l'intervention n'a pas commencé (pending ou confirmed) :
-- une fois in_progress (start_job, providers.sql), le prestataire est sur place. Les devis encore en attente passent à declined pour qu'on
-- ne puisse plus les accepter. Message système dans chaque conversation.
create or replace function public.cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.bookings
  where id = p_booking_id
    and user_id = auth.uid()
    and status in ('pending', 'confirmed')
  for update;
  if not found then raise exception 'booking_not_cancellable'; end if;

  update public.bookings set status = 'cancelled' where id = p_booking_id;

  update public.messages m
  set quote = jsonb_set(m.quote, '{status}', '"declined"')
  from public.conversations c
  where c.id = m.conversation_id
    and c.booking_id = p_booking_id
    and m.type = 'quote'
    and m.quote ->> 'status' = 'pending';

  insert into public.messages (conversation_id, sender_kind, type, text, system_key)
  select c.id, 'system', 'system', 'Vous avez annulé cette réservation.', 'bookingCancelled'
  from public.conversations c
  where c.booking_id = p_booking_id;
end;
$$;

-- --- set_booking_photos : rattache les photos téléversées à la réservation ---
-- Les chemins doivent être dans le dossier Storage du client et de cette
-- réservation ({user}/{booking}/…), comme l'impose la policy du bucket.
create or replace function public.set_booking_photos(p_booking_id uuid, p_photos text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.bookings
  where id = p_booking_id and user_id = auth.uid();
  if not found then raise exception 'booking_not_found'; end if;

  if exists (
    select 1 from unnest(p_photos) as p(path)
    where p.path not like auth.uid()::text || '/' || p_booking_id::text || '/%'
  ) then
    raise exception 'invalid_photo_path';
  end if;

  update public.bookings set photos = p_photos where id = p_booking_id;
end;
$$;

-- --- mark_conversation_read : remet à zéro les non-lus de l'appelant --------
-- Client de la conversation -> client_unread_count ; prestataire -> provider_unread_count.
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set client_unread_count = 0
  where id = p_conversation_id and user_id = auth.uid();

  update public.conversations
  set provider_unread_count = 0
  where id = p_conversation_id and provider_id = public.current_provider_id();
end;
$$;

-- --- Droits d'exécution : utilisateurs connectés uniquement ---------------
revoke execute on function public.accept_quote(uuid) from public, anon;
revoke execute on function public.decline_quote(uuid) from public, anon;
revoke execute on function public.cancel_booking(uuid) from public, anon;
revoke execute on function public.set_booking_photos(uuid, text[]) from public, anon;
revoke execute on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.accept_quote(uuid) to authenticated;
grant execute on function public.decline_quote(uuid) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.set_booking_photos(uuid, text[]) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
