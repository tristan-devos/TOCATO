-- Scénarios photos des prestataires, joués après scenarios-applications.sql (même base).
-- Chaque bloc annonce le résultat attendu (« doit échouer » = ERROR attendue).
-- Acteurs : Alice (cliente), Bob (simple utilisateur), Carla (plombière approuvée,
-- photo publiée carla/photo.jpg), Eve (déménageuse, demande en cours), Dana (admin).
\set VERBOSITY terse
\set alice '11111111-1111-1111-1111-111111111111'
\set bob   '22222222-2222-2222-2222-222222222222'
\set carla '55555555-5555-5555-5555-555555555555'
\set dana  '66666666-6666-6666-6666-666666666666'
\set eve   '77777777-7777-7777-7777-777777777777'

-- --- Mise en place : fichiers du bucket (déposés par le rôle postgres) ---
reset role;
insert into storage.objects (bucket_id, name) values
 ('provider-photos', :'carla' || '/photo.jpg'),
 ('provider-photos', :'carla' || '/nouvelle.jpg'),
 ('provider-photos', :'eve' || '/photo.jpg');
select id as carla_fiche from providers where user_id = :'carla' \gset

set role authenticated;
\echo '--- Alice (cliente) : voit la photo publiée de Carla seulement (1)'
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
select count(*) as photos_visibles from storage.objects where bucket_id = 'provider-photos';
\echo '--- Alice : ne dépose pas dans le dossier de Carla (doit échouer)'
insert into storage.objects (bucket_id, name) values ('provider-photos', :'carla' || '/x.jpg');

\echo '--- Eve (demande en cours) : voit la photo publiée et la sienne (2)'
select set_config('request.jwt.claim.sub', :'eve', false) \g /dev/null
select count(*) as photos_visibles from storage.objects where bucket_id = 'provider-photos';

\echo '--- Bob (pas prestataire) : submit_provider_photo refusé (doit échouer : not_provider)'
select set_config('request.jwt.claim.sub', :'bob', false) \g /dev/null
select submit_provider_photo(:'bob' || '/photo.jpg');

\echo '--- Carla : photo dans le dossier de Bob (doit échouer), puis la sienne (doit réussir)'
select set_config('request.jwt.claim.sub', :'carla', false) \g /dev/null
select submit_provider_photo(:'bob' || '/photo.jpg');
select submit_provider_photo(:'carla' || '/nouvelle.jpg');
select status, photo_path = :'carla' || '/nouvelle.jpg' as proposee from provider_photo_changes;
\echo '--- Écriture directe : insert (doit échouer), update (0 ligne)'
insert into provider_photo_changes (provider_id, user_id, photo_path)
  values (:'carla_fiche', :'carla', :'carla' || '/y.jpg');
update provider_photo_changes set status = 'rejected';
\echo '--- Carla : la photo publiée ne change pas avant validation (photo.jpg)'
select photo_path = :'carla' || '/photo.jpg' as ancienne_photo from providers where id = :'carla_fiche';

\echo '--- Alice : ne voit ni la proposition (0) ni son fichier (toujours 1 photo)'
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
select (select count(*) from provider_photo_changes) as propositions,
       (select count(*) from storage.objects where bucket_id = 'provider-photos') as photos;
\echo '--- Alice : ne peut ni valider ni refuser (doivent échouer : not_admin)'
select admin_approve_photo(:'carla_fiche');
select admin_reject_photo(:'carla_fiche', 'non');

\echo '--- Dana (admin) : voit la proposition (1) et les 3 fichiers'
select set_config('request.jwt.claim.sub', :'dana', false) \g /dev/null
select (select count(*) from provider_photo_changes) as propositions,
       (select count(*) from storage.objects where bucket_id = 'provider-photos') as photos;
\echo '--- Refus sans motif (doit échouer), avec motif (doit réussir)'
select admin_reject_photo(:'carla_fiche', ' ');
select admin_reject_photo(:'carla_fiche', 'Visage caché');
\echo '--- Valider une photo refusée (doit échouer : photo_not_pending)'
select admin_approve_photo(:'carla_fiche');

\echo '--- Carla voit le refus et son motif, puis renvoie (doit réussir)'
select set_config('request.jwt.claim.sub', :'carla', false) \g /dev/null
select status, rejection_reason from provider_photo_changes;
select submit_provider_photo(:'carla' || '/nouvelle.jpg');
select status, rejection_reason is null as motif_efface from provider_photo_changes;

\echo '--- Dana valide : photo publiée remplacée, proposition supprimée'
select set_config('request.jwt.claim.sub', :'dana', false) \g /dev/null
select admin_approve_photo(:'carla_fiche');
select photo_path = :'carla' || '/nouvelle.jpg' as nouvelle_publiee from providers where id = :'carla_fiche';
select count(*) as propositions from provider_photo_changes;

\echo '--- Alice : voit la nouvelle photo, plus l''ancienne (1, nouvelle.jpg)'
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
select count(*) as photos, bool_and(name = :'carla' || '/nouvelle.jpg') as nouvelle
  from storage.objects where bucket_id = 'provider-photos';

\echo '--- Anon : aucune photo (0), pas d''erreur'
reset role; set role anon;
select set_config('request.jwt.claim.sub', '', false) \g /dev/null
select count(*) as photos from storage.objects where bucket_id = 'provider-photos';
reset role;
