-- Scénarios côté prestataire (lot 3), joués après scenarios.sql dans la même base.
-- Chaque bloc annonce le résultat attendu (« doit échouer » = ERROR attendue).
-- Acteurs : Alice (cliente), Bob (simple utilisateur), Paul (plombier réel, fiche
-- p-paul reliée par l'admin), Gina (jardinière réelle, fiche p-gina).
\set VERBOSITY terse
\set alice '11111111-1111-1111-1111-111111111111'
\set bob   '22222222-2222-2222-2222-222222222222'
\set paul  '33333333-3333-3333-3333-333333333333'
\set gina  '44444444-4444-4444-4444-444444444444'

-- --- Mise en place (rôle postgres = admin, comme dans le SQL editor) ---
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
 (:'paul', 'paul@test.ca', '{"name":"Paul Plombier"}'),
 (:'gina', 'gina@test.ca', '{"name":"Gina Jardin"}');
insert into providers (id, name, services, hourly_rate) values
 ('p-paul', 'Paul Plombier', array['plumber'], 90),
 ('p-gina', 'Gina Jardin', array['gardener'], 50);
\echo '--- Admin relie Paul et Gina (doit réussir), puis une fiche inexistante (doit échouer)'
select admin_link_provider('p-paul', 'PAUL@test.ca');
select admin_link_provider('p-gina', 'gina@test.ca');
select admin_link_provider('p-inconnu', 'bob@test.ca');
\echo '--- Relier Paul à une seconde fiche (doit échouer : un compte, une fiche)'
select admin_link_provider('p-marc', 'paul@test.ca');
\echo '--- Un utilisateur ne peut pas appeler la fonction admin (doit échouer)'
set role authenticated;
select set_config('request.jwt.claim.sub', :'bob', false) \g /dev/null
select admin_link_provider('p-paul', 'bob@test.ca');
\echo '--- ... ni se donner une fiche lui-même (0 ligne modifiée)'
update providers set user_id = :'bob' where id = 'p-paul';
select user_id = :'paul' as paul_toujours_relie from providers where id = 'p-paul';

\echo '--- Alice crée une nouvelle demande de plomberie (avec photo)'
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
select create_booking('plumber', null, 'morning',
  '{"id":"a","label":"Maison","street":"4521, rue Saint-Denis","city":"Montréal","postalCode":"h2j 2l2"}',
  '[]', 'Robinet qui fuit', 100, 200) as bk \gset
select set_booking_photos(:'bk', array[:'alice' || '/' || :'bk' || '/0.jpg']);
reset role;
insert into storage.objects (bucket_id, name) values ('booking-photos', :'alice' || '/' || :'bk' || '/0.jpg');

\echo '--- Paul : voit la demande via list_open_requests (ville + secteur, pas de rue)'
set role authenticated;
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
select current_provider_id();
select city, postal_sector, my_conversation_id is null as pas_encore_offert
  from list_open_requests() where id = :'bk';
\echo '--- Paul : ne lit PAS la ligne bookings d''une demande ouverte (0), ni le profil d''Alice (0)'
select count(*) as bookings_lisibles from bookings where id = :'bk';
select count(*) as profils_lisibles from profiles where id = :'alice';
\echo '--- Paul : lit la photo de la demande (1) ; Gina (jardinière) non (0)'
select count(*) as photos_paul from storage.objects where bucket_id = 'booking-photos';
select set_config('request.jwt.claim.sub', :'gina', false) \g /dev/null
select count(*) as demandes_gina from list_open_requests() where id = :'bk';
select count(*) as photos_gina from storage.objects where bucket_id = 'booking-photos';
\echo '--- Gina : devis hors de son service (doit échouer)'
select send_quote(:'bk', 150, 'x');
\echo '--- Bob (pas prestataire) : devis (doit échouer)'
select set_config('request.jwt.claim.sub', :'bob', false) \g /dev/null
select send_quote(:'bk', 150, 'x');

\echo '--- Paul envoie un devis (doit réussir), puis un 2e en attente (doit échouer)'
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
select send_quote(:'bk', 0, 'x');
select send_quote(:'bk', 150, 'Changement du joint') as conv \gset
select send_quote(:'bk', 140, 'Encore');
select my_quote_status from list_open_requests() where id = :'bk';
\echo '--- Paul écrit un texte (doit réussir) ; faux devis direct / message au nom de Marc (doivent échouer)'
insert into messages (conversation_id, sender_kind, provider_id, type, text)
  values (:'conv', 'provider', 'p-paul', 'text', 'Je peux passer demain matin.');
insert into messages (conversation_id, sender_kind, provider_id, type, text, quote)
  values (:'conv', 'provider', 'p-paul', 'quote', 'x', '{"amount":1,"details":"","status":"pending"}');
insert into messages (conversation_id, sender_kind, provider_id, type, text)
  values (:'conv', 'provider', 'p-marc', 'text', 'usurpation');
\echo '--- Paul : prénom du client seulement'
select client_first_name from provider_conversation_clients() where conversation_id = :'conv';
\echo '--- Un prestataire ne peut pas créer de demande (doit échouer)'
select create_booking('plumber', null, null, '{}', '[]', 'x', 1, 2);

\echo '--- Alice voit la conversation de Paul ; non-lus Alice = 2 (devis + texte)'
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
select client_unread_count, provider_unread_count from conversations where id = :'conv';
insert into messages (conversation_id, sender_kind, type, text) values (:'conv', 'client', 'text', 'Parfait !');
select mark_conversation_read(:'conv');
\echo '--- Après lecture par Alice : client 0 ; prestataire 1 (le message d''Alice)'
select client_unread_count, provider_unread_count from conversations where id = :'conv';
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
select mark_conversation_read(:'conv');
select client_unread_count, provider_unread_count from conversations where id = :'conv';

\echo '--- Paul ne peut pas commencer avant acceptation (doit échouer)'
select start_job(:'bk');
\echo '--- Alice accepte le devis de Paul'
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
select accept_quote((select id from messages where conversation_id = :'conv' and type = 'quote'));
\echo '--- Paul lit maintenant la réservation complète, adresse exacte comprise'
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
select status, provider_id, address ->> 'street' as rue from bookings where id = :'bk';
select count(*) as encore_dans_demandes_ouvertes from list_open_requests() where id = :'bk';
\echo '--- Gina ne peut pas commencer le travail de Paul (doit échouer)'
select set_config('request.jwt.claim.sub', :'gina', false) \g /dev/null
select start_job(:'bk');
\echo '--- Paul commence ; Alice ne peut plus annuler (doit échouer) ; Paul termine (date de fin posée)'
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
select start_job(:'bk');
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
select cancel_booking(:'bk');
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
select complete_job(:'bk');
select complete_job(:'bk');
select status, completed_at is not null as date_de_fin from bookings where id = :'bk';
select system_key, text from messages where conversation_id = :'conv' and sender_kind = 'system' order by created_at;
\echo '--- Devis de Paul : sans texte (la carte s''affiche dans la langue de chacun)'
select text = '' as sans_texte from messages where conversation_id = :'conv' and type = 'quote';
\echo '--- Paul ne voit que SES conversations (1), aucune de Marc/Amadou/Sophie'
select count(*) as conversations_paul from conversations;

\echo '--- Anon (non connecté) : tout vide, pas d''erreur (0, 0, 0, 0 : providers compris)'
reset role; set role anon;
select set_config('request.jwt.claim.sub', '', false) \g /dev/null
select (select count(*) from bookings) as b, (select count(*) from conversations) as c,
       (select count(*) from messages) as m, (select count(*) from providers) as p;
