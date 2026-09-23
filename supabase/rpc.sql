-- =============================================================================
-- TOCATO : fonctions & triggers (à exécuter APRÈS schema.sql, idempotent)
-- =============================================================================

-- --- Trigger : tenir conversations à jour à chaque message ----------------
-- Met à jour last_message_at et incrémente le compteur de non-lus du
-- DESTINATAIRE : message prestataire -> client_unread_count, message client ->
-- provider_unread_count (les messages système ne comptent pas).
-- security definer : le client n'a plus de policy d'update sur conversations
-- (transitions via RPC, voir transitions.sql) ; le trigger doit pouvoir écrire.
create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      client_unread_count = client_unread_count
        + case when new.sender_kind = 'provider' then 1 else 0 end,
      provider_unread_count = provider_unread_count
        + case when new.sender_kind = 'client' then 1 else 0 end
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- --- create_booking : crée une demande ouverte (appel d'offres) --------------
-- Pas de prestataire à la création : les prestataires intéressés ouvrent chacun
-- leur conversation avec un devis (send_quote, providers.sql).
-- security definer : le client n'a pas de policy d'insert sur bookings. La
-- fonction force user_id = auth.uid(), status = 'pending', provider_id = null ;
-- les photos sont rattachées ensuite via set_booking_photos. Renvoie l'id.
-- L'ancienne signature (avec p_photos et p_provider_id) est supprimée.
drop function if exists public.create_booking(
  text, date, text, jsonb, jsonb, text, text[], numeric, numeric, text
);
create or replace function public.create_booking(
  p_service_id     text,
  p_scheduled_date date,
  p_time_slot      text,
  p_address        jsonb,
  p_answers        jsonb,
  p_description    text,
  p_estimate_min   numeric,
  p_estimate_max   numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  -- v1 : un compte prestataire n'est pas aussi client (docs, §10).
  if public.current_provider_id() is not null then
    raise exception 'providers_cannot_book';
  end if;
  -- Un demandeur d'adhésion non plus (applications.sql, table créée après ce fichier :
  -- plpgsql ne la résout qu'à l'exécution).
  if exists (select 1 from public.provider_applications where user_id = auth.uid()) then
    raise exception 'applicants_cannot_book';
  end if;

  insert into public.bookings (
    user_id, service_id, status, scheduled_date, time_slot, address,
    answers, description, estimate_min, estimate_max
  ) values (
    auth.uid(), p_service_id, 'pending', p_scheduled_date, p_time_slot,
    p_address, p_answers, p_description, p_estimate_min, p_estimate_max
  )
  returning id into v_booking;

  return v_booking;
end;
$$;
revoke execute on function public.create_booking(
  text, date, text, jsonb, jsonb, text, numeric, numeric
) from public, anon;
grant execute on function public.create_booking(
  text, date, text, jsonb, jsonb, text, numeric, numeric
) to authenticated;

-- --- seed_demo : supprimé (lot 5, fin de la simulation) ------------------
drop function if exists public.seed_demo();
