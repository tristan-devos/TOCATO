-- Scénarios RLS / RPC joués en tant qu'utilisateur (rôle authenticated, JWT simulé).
-- Chaque bloc annonce le résultat attendu (« doit échouer » = ERROR attendue).
-- Lancer via supabase/tests/run.sh (voir AGENTS.md > Commandes).
\set VERBOSITY terse
insert into auth.users (id, email, raw_user_meta_data) values
 ('11111111-1111-1111-1111-111111111111','alice@test.ca','{"name":"Alice"}'),
 ('22222222-2222-2222-2222-222222222222','bob@test.ca','{"name":"Bob"}');

set role authenticated;
select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
select seed_demo();
\echo '--- données démo d''Alice'
select service_id, status, agreed_price from bookings order by service_id;

\echo '--- TROU 1 : update direct du statut/prix (doit toucher 0 ligne)'
update bookings set status='confirmed', agreed_price=1 where service_id='plumber';
select status, agreed_price from bookings where service_id='plumber';

\echo '--- TROU 2 : modifier le montant d''un devis (doit toucher 0 ligne)'
update messages set quote = jsonb_set(quote,'{amount}','1') where type='quote';
select quote->>'amount' as montant from messages where type='quote';

\echo '--- Forger un message système / un faux devis (doit échouer)'
insert into messages (conversation_id, sender_kind, type, text)
  select id,'system','system','Devis accepté' from conversations limit 1;
insert into messages (conversation_id, sender_kind, type, text, quote)
  select id,'client','quote','x','{"amount":1,"status":"pending","details":""}' from conversations limit 1;
\echo '--- Message texte normal (doit réussir)'
insert into messages (conversation_id, sender_kind, type, text)
  select c.id,'client','text','Bonjour' from conversations c join bookings b on b.id=c.booking_id where b.service_id='plumber';
select count(*) as messages_bonjour_inseres from messages where text='Bonjour';

\echo '--- Bob tente d''accepter le devis d''Alice (doit échouer)'
select set_config('request.jwt.claim.sub','22222222-2222-2222-2222-222222222222',false);
select accept_quote((select id from messages where type='quote' limit 1));
select count(*) as bookings_visibles_par_bob from bookings;

select set_config('request.jwt.claim.sub','11111111-1111-1111-1111-111111111111',false);
\echo '--- Appel d''offres : la demande plomberie a 2 offres (Marc 185, Amadou 170), sans prestataire'
select b.provider_id is null as sans_prestataire, count(c.*) as conversations
  from bookings b join conversations c on c.booking_id = b.id where b.service_id='plumber' group by 1;

\echo '--- Alice accepte l''offre d''Amadou (doit réussir)'
select accept_quote((select m.id from messages m join conversations c on c.id=m.conversation_id
  where m.type='quote' and c.provider_id='p-amadou'));
select status, agreed_price, provider_id from bookings where service_id='plumber';
\echo '--- Devis : Amadou accepted, Marc declined'
select c.provider_id, m.quote->>'status' as statut_devis from messages m
  join conversations c on c.id=m.conversation_id where m.type='quote' order by 1;
\echo '--- Dernier message système de chaque conversation'
select distinct on (c.provider_id) c.provider_id, m.text from messages m
  join conversations c on c.id=m.conversation_id where m.sender_kind='system'
  order by c.provider_id, m.created_at desc;
\echo '--- Accepter ensuite l''offre de Marc (doit échouer)'
select accept_quote((select m.id from messages m join conversations c on c.id=m.conversation_id
  where m.type='quote' and c.provider_id='p-marc'));

\echo '--- Non-lus : Alice les remet à zéro (1 -> 0)'
select client_unread_count from conversations where provider_id='p-marc';
select mark_conversation_read((select id from conversations where provider_id='p-marc'));
select client_unread_count from conversations where provider_id='p-marc';

\echo '--- Nouvelle demande via create_booking + photos'
select create_booking('mover', null, null, '{"id":"a","label":"x","street":"s","city":"Montréal","postalCode":"H2J 2L2"}', '[]', 'd', 100, 200) as bk \gset
\echo '--- Demande ouverte : pending, sans prestataire'
select status, provider_id is null as sans_prestataire from bookings where id = :'bk';
select set_booking_photos(:'bk', array['11111111-1111-1111-1111-111111111111/' || :'bk' || '/0.jpg']);
select photos from bookings where id = :'bk';
\echo '--- Photo hors de son dossier (doit échouer)'
select set_booking_photos(:'bk', array['22222222-2222-2222-2222-222222222222/x/0.jpg']);

\echo '--- Annulation (doit réussir), puis ré-annulation (doit échouer)'
select cancel_booking(:'bk');
select status from bookings where id = :'bk';
select cancel_booking(:'bk');
\echo '--- Annuler une réservation terminée (doit échouer)'
select cancel_booking((select id from bookings where status='completed'));

\echo '--- Anon ne peut pas appeler les RPC'
reset role; set role anon;
select cancel_booking(:'bk');
