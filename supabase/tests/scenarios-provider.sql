-- Scénarios côté prestataire (lot 3), joués après scenarios.sql dans la même base.
-- Chaque bloc annonce le résultat attendu (« doit échouer » = ERROR attendue).
-- Acteurs : Alice (cliente), Bob (simple utilisateur), Paul (plombier réel, fiche
-- p-paul reliée par l'admin), Gina (jardinière réelle, fiche p-gina).
\set VERBOSITY terse
\set alice '11111111-1111-1111-1111-111111111111'
\set bob   '22222222-2222-2222-2222-222222222222'
\set paul  '33333333-3333-3333-3333-333333333333'
\set gina  '44444444-4444-4444-4444-444444444444'
-- Lignes de devis valides (main-d'œuvre 120 $ + pièces 30 $ = 150 $).
\set lignes '[{"label":"Main-d''œuvre","category":"labor","amount":120},{"label":"Joint","category":"parts","amount":30}]'

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
select send_quote(:'bk', :'lignes', montreal_today() + 1, 'morning', 2, 'x', '');
\echo '--- Bob (pas prestataire) : devis (doit échouer)'
select set_config('request.jwt.claim.sub', :'bob', false) \g /dev/null
select send_quote(:'bk', :'lignes', montreal_today() + 1, 'morning', 2, 'x', '');

\echo '--- Paul : devis invalides (7 échecs : sans ligne, catégorie, montant nul, date passée, date à +61 j, créneau, durée)'
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
select send_quote(:'bk', '[]', montreal_today() + 1, 'morning', 2, 'x', '');
select send_quote(:'bk', '[{"label":"X","category":"cadeau","amount":10}]', montreal_today() + 1, 'morning', 2, 'x', '');
select send_quote(:'bk', '[{"label":"X","category":"labor","amount":0}]', montreal_today() + 1, 'morning', 2, 'x', '');
select send_quote(:'bk', :'lignes', montreal_today() - 1, 'morning', 2, 'x', '');
select send_quote(:'bk', :'lignes', montreal_today() + 61, 'morning', 2, 'x', '');
select send_quote(:'bk', :'lignes', montreal_today() + 1, 'nuit', 2, 'x', '');
select send_quote(:'bk', :'lignes', montreal_today() + 1, 'morning', 0, 'x', '');
\echo '--- Paul envoie un devis (doit réussir, total 150 calculé), puis un 2e en attente (doit échouer)'
select send_quote(:'bk', :'lignes', montreal_today() + 2, 'afternoon', 2.5,
  'Changement du joint', 'Pièces garanties 1 an') as conv \gset
select quote ->> 'amount' as total, jsonb_array_length(quote -> 'lines') as lignes,
       quote ->> 'proposed_slot' as creneau
  from messages where conversation_id = :'conv' and type = 'quote';
select send_quote(:'bk', :'lignes', montreal_today() + 1, 'morning', 1, 'Encore', '');
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
\echo '--- La date et le créneau du devis deviennent ceux de la mission (dans 2 jours, après-midi)'
select scheduled_date = montreal_today() + 2 as date_du_devis, time_slot from bookings where id = :'bk';
\echo '--- Paul lit maintenant la réservation complète, adresse exacte comprise'
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
select status, provider_id, address ->> 'street' as rue from bookings where id = :'bk';
select count(*) as encore_dans_demandes_ouvertes from list_open_requests() where id = :'bk';
\echo '--- Changement de date : Gina (pas retenue) ne peut pas proposer (doit échouer)'
select set_config('request.jwt.claim.sub', :'gina', false) \g /dev/null
select propose_reschedule(:'bk', montreal_today() + 5, 'morning', 'x');
\echo '--- Paul : date passée, même date et créneau (doivent échouer), puis une proposition (doit réussir), une 2e (doit échouer)'
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
select propose_reschedule(:'bk', montreal_today() - 1, 'morning', '');
select propose_reschedule(:'bk', montreal_today() + 2, 'afternoon', '');
select propose_reschedule(:'bk', montreal_today() + 5, 'morning', 'Camion en panne') as resched \gset
select propose_reschedule(:'bk', montreal_today() + 6, 'morning', '');
\echo '--- Paul : fausse carte directe (doit échouer), répondre à sa propre proposition (doit échouer)'
insert into messages (conversation_id, sender_kind, provider_id, type, text, reschedule)
  values (:'conv', 'provider', 'p-paul', 'reschedule', '', '{"status":"accepted"}');
select respond_reschedule(:'resched', true);
\echo '--- Alice refuse : date inchangée (dans 2 jours, après-midi), message rescheduleDeclined'
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
select respond_reschedule(:'resched', false);
select scheduled_date = montreal_today() + 2 as date_inchangee, time_slot from bookings where id = :'bk';
\echo '--- Paul repropose, Alice accepte : nouvelle date (dans 5 jours, matin) ; répondre à nouveau (doit échouer)'
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
select propose_reschedule(:'bk', montreal_today() + 5, 'morning', 'Camion en panne') as resched \gset
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
select respond_reschedule(:'resched', true);
select scheduled_date = montreal_today() + 5 as nouvelle_date, time_slot from bookings where id = :'bk';
select respond_reschedule(:'resched', false);
select system_key from messages where conversation_id = :'conv' and system_key like 'reschedule%'
  order by created_at;
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

\echo '--- Fin de mission : carte de notation (1), fiche de Paul : 1 prestation réalisée'
select count(*) as cartes_notation from messages where conversation_id = :'conv' and type = 'review_request';
select jobs_completed from providers where id = 'p-paul';
\echo '--- Moins de 48 h après la fin : Alice et Paul écrivent encore (doivent réussir)'
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
insert into messages (conversation_id, sender_kind, type, text)
  values (:'conv', 'client', 'text', 'Merci, tout fonctionne !');
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
insert into messages (conversation_id, sender_kind, provider_id, type, text)
  values (:'conv', 'provider', 'p-paul', 'text', 'Avec plaisir.');
\echo '--- Notes : Bob (doit échouer), note 6 (doit échouer), Alice 4 étoiles (doit réussir), 2e note (doit échouer)'
select set_config('request.jwt.claim.sub', :'bob', false) \g /dev/null
select submit_review(:'bk', 5, '');
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
select submit_review(:'bk', 6, '');
select submit_review(:'bk', 4, 'Rapide et soigneux');
select submit_review(:'bk', 5, '');
\echo '--- Fiche de Paul recalculée : 4.0, 1 avis ; écriture directe d''un avis (doit échouer)'
select rating, review_count from providers where id = 'p-paul';
insert into reviews (booking_id, provider_id, client_id, rating) values (:'bk', 'p-paul', :'alice', 5);
\echo '--- Paul lit son avis (1) ; Gina non (0)'
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
select count(*) as avis_paul from reviews;
select set_config('request.jwt.claim.sub', :'gina', false) \g /dev/null
select count(*) as avis_gina from reviews;
\echo '--- Plus de 48 h après la fin : conversation fermée pour Alice et Paul (doivent échouer)'
reset role;
update bookings set completed_at = now() - interval '49 hours' where id = :'bk';
set role authenticated;
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
insert into messages (conversation_id, sender_kind, type, text)
  values (:'conv', 'client', 'text', 'Encore une question');
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
insert into messages (conversation_id, sender_kind, provider_id, type, text)
  values (:'conv', 'provider', 'p-paul', 'text', 'Encore là');
\echo '--- Plus de 30 jours après la fin : note refusée (review_window_closed)'
reset role;
delete from reviews where booking_id = :'bk';
update bookings set completed_at = now() - interval '31 days' where id = :'bk';
set role authenticated;
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
select submit_review(:'bk', 5, '');
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
\echo '--- Conversation fermée : prestataire non retenu (f), demande annulée (f)'
reset role;
insert into conversations (user_id, provider_id, booking_id)
  values (:'alice', 'p-gina', :'bk') returning id as conv_gina \gset
select conversation_open(:'conv_gina') as non_retenu;
delete from conversations where id = :'conv_gina';
update bookings set status = 'cancelled' where id = :'bk';
select conversation_open(:'conv') as annulee;
update bookings set status = 'completed' where id = :'bk';
set role authenticated;
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
\echo '--- Devis de Paul : sans texte (la carte s''affiche dans la langue de chacun)'
select text = '' as sans_texte from messages where conversation_id = :'conv' and type = 'quote';
\echo '--- Paul ne voit que SES conversations (1), aucune de Marc/Amadou/Sophie'
select count(*) as conversations_paul from conversations;

\echo '--- Anon (non connecté) : tout vide, pas d''erreur (0, 0, 0, 0 : providers compris)'
reset role; set role anon;
select set_config('request.jwt.claim.sub', '', false) \g /dev/null
select (select count(*) from bookings) as b, (select count(*) from conversations) as c,
       (select count(*) from messages) as m, (select count(*) from providers) as p;
