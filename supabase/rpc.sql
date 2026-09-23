-- =============================================================================
-- TOCATO — fonctions & triggers (à exécuter APRÈS schema.sql, idempotent)
-- =============================================================================

-- ——— Trigger : tenir conversations à jour à chaque message ————————————————
-- Met à jour last_message_at et incrémente unread_count pour les messages
-- entrants (prestataire). Évite de gérer ces champs côté client.
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
      unread_count = unread_count + case when new.sender_kind = 'provider' then 1 else 0 end
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- ——— create_booking : création atomique booking + conversation + 1er message —
-- Évite le FK circulaire et tout uuid côté client. Renvoie les deux ids.
-- security definer : le client n'a plus de policy d'insert sur bookings /
-- conversations ni le droit d'insérer des messages 'system'. La fonction force
-- user_id = auth.uid() et status = 'pending'.
create or replace function public.create_booking(
  p_service_id     text,
  p_scheduled_date date,
  p_time_slot      text,
  p_address        jsonb,
  p_answers        jsonb,
  p_description    text,
  p_photos         text[],
  p_estimate_min   numeric,
  p_estimate_max   numeric,
  p_provider_id    text
)
returns table (booking_id uuid, conversation_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking      uuid := gen_random_uuid();
  v_conversation uuid := gen_random_uuid();
  v_provider     text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select name into v_provider from public.providers where id = p_provider_id;

  -- bookings.conversation_id n'a pas de FK -> on peut insérer le booking d'abord.
  insert into public.bookings (
    id, user_id, service_id, status, scheduled_date, time_slot, address,
    answers, description, photos, estimate_min, estimate_max,
    provider_id, conversation_id
  ) values (
    v_booking, auth.uid(), p_service_id, 'pending', p_scheduled_date, p_time_slot,
    p_address, p_answers, p_description, p_photos, p_estimate_min,
    p_estimate_max, p_provider_id, v_conversation
  );

  insert into public.conversations (id, user_id, provider_id, booking_id)
  values (v_conversation, auth.uid(), p_provider_id, v_booking);

  insert into public.messages (conversation_id, sender_kind, type, text)
  values (v_conversation, 'system', 'system',
          'Votre demande a été envoyée à ' || coalesce(v_provider, '') || '.');

  return query select v_booking, v_conversation;
end;
$$;

-- ——— seed_demo : charge des réservations d'exemple dans le compte courant ——
-- Remplace « Réinitialiser la démo ». Efface les bookings de l'utilisateur
-- (cascade) puis insère deux scénarios datés relativement à aujourd'hui.
-- security definer : le seed insère des messages 'provider' (interdits au client
-- par la policy messages_insert_own). La fonction reste limitée au compte courant
-- via auth.uid() (lecture du JWT, indépendante du rôle d'exécution).
create or replace function public.seed_demo()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_addr   jsonb := '{"id":"addr-home","label":"Maison","street":"4521, rue Saint-Denis, app. 3","city":"Montréal","postalCode":"H2J 2L2"}'::jsonb;
  v_plomb  uuid := gen_random_uuid();
  v_cplomb uuid := gen_random_uuid();
  v_jard   uuid := gen_random_uuid();
  v_cjard  uuid := gen_random_uuid();
begin
  if v_uid is null then return; end if;
  delete from public.bookings where user_id = v_uid;

  -- Scénario 1 : plomberie en attente, devis en attente dans le chat.
  insert into public.bookings (id, user_id, service_id, status, created_at,
    scheduled_date, time_slot, address, answers, description, photos,
    estimate_min, estimate_max, provider_id, conversation_id)
  values (v_plomb, v_uid, 'plumber', 'pending', now() - interval '2 days 3 hours',
    (now() + interval '3 days')::date, 'morning', v_addr,
    '[{"questionId":"issue","questionLabel":"Quel est le problème ?","values":["Fuite d''eau"]},{"questionId":"urgency","questionLabel":"C''est urgent ?","values":["Cette semaine"]},{"questionId":"housingType","questionLabel":"Type de logement ?","values":["Appartement / condo"]}]'::jsonb,
    'Fuite sous l''évier de la cuisine, le raccord du siphon goutte en continu. J''ai mis un seau en attendant.',
    '{}', 170, 300, 'p-marc', v_cplomb);
  insert into public.conversations (id, user_id, provider_id, booking_id)
  values (v_cplomb, v_uid, 'p-marc', v_plomb);
  insert into public.messages (conversation_id, sender_kind, provider_id, type, text, created_at, quote) values
    (v_cplomb, 'system', null, 'system', 'Votre demande a été envoyée à Marc Tremblay.', now() - interval '2 days 3 hours', null),
    (v_cplomb, 'provider', 'p-marc', 'text', 'Bonjour ! J''ai bien vu votre demande pour la fuite sous l''évier. Les photos sont claires, c''est fort probablement le joint du siphon.', now() - interval '2 days 1 hour', null),
    (v_cplomb, 'client', null, 'text', 'Bonjour ! Oui c''est ça, ça goutte surtout quand on fait couler l''eau. Vous pouvez passer cette semaine ?', now() - interval '1 day 6 hours', null),
    (v_cplomb, 'provider', 'p-marc', 'quote', 'Voici mon devis pour l''intervention. Je peux passer comme prévu en matinée.', now() - interval '2 hours',
     '{"amount":185,"details":"Remplacement du siphon et des joints, main-d''œuvre et déplacement inclus. Garantie 6 mois.","status":"pending"}'::jsonb);

  -- Scénario 2 : jardinage terminé, facture dans le chat.
  insert into public.bookings (id, user_id, service_id, status, created_at,
    scheduled_date, time_slot, address, answers, description, photos,
    estimate_min, estimate_max, agreed_price, provider_id, conversation_id)
  values (v_jard, v_uid, 'gardener', 'completed', now() - interval '16 days',
    (now() - interval '12 days')::date, 'afternoon', v_addr,
    '[{"questionId":"work","questionLabel":"Quels travaux ?","values":["Tonte de pelouse","Taille de haies et arbustes"]},{"questionId":"area","questionLabel":"Quelle surface ?","values":["Petit terrain"]},{"questionId":"frequency","questionLabel":"À quelle fréquence ?","values":["Une seule fois"]}]'::jsonb,
    'Petite cour arrière, haie de cèdres à rafraîchir avant l''été.',
    '{}', 135, 270, 160, 'p-sophie', v_cjard);
  insert into public.conversations (id, user_id, provider_id, booking_id)
  values (v_cjard, v_uid, 'p-sophie', v_jard);
  insert into public.messages (conversation_id, sender_kind, provider_id, type, text, created_at, document) values
    (v_cjard, 'system', null, 'system', 'Votre demande a été envoyée à Sophie Gagnon.', now() - interval '16 days', null),
    (v_cjard, 'provider', 'p-sophie', 'text', 'Bonjour ! Merci pour votre demande. Pour une petite cour avec haie de cèdres, je propose 160 $ tout inclus.', now() - interval '15 days', null),
    (v_cjard, 'client', null, 'text', 'Parfait pour moi, on confirme !', now() - interval '15 days' + interval '2 hours', null),
    (v_cjard, 'provider', 'p-sophie', 'text', 'C''est fait ! La haie est taillée et la pelouse tondue. Merci pour votre confiance.', now() - interval '12 days' + interval '5 hours', null),
    (v_cjard, 'provider', 'p-sophie', 'document', 'Voici votre facture.', now() - interval '11 days',
     '{"name":"Facture-TOCATO-0214.pdf","size":"86 Ko"}'::jsonb);

  -- Le trigger a recalculé unread_count/last_message_at ; on fixe l'état voulu.
  update public.conversations set unread_count = 1, last_message_at = now() - interval '2 hours' where id = v_cplomb;
  update public.conversations set unread_count = 0, last_message_at = now() - interval '11 days' where id = v_cjard;
end;
$$;
