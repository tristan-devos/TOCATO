-- Scénarios adhésion des prestataires, joués après scenarios-provider.sql (même base).
-- Chaque bloc annonce le résultat attendu (« doit échouer » = ERROR attendue).
-- Acteurs : Alice (cliente), Bob (simple utilisateur), Paul (plombier relié),
-- Carla (plombière qui adhère), Eve (déménageuse qui adhère), Dana (admin).
\set VERBOSITY terse
\set alice '11111111-1111-1111-1111-111111111111'
\set bob   '22222222-2222-2222-2222-222222222222'
\set paul  '33333333-3333-3333-3333-333333333333'
\set carla '55555555-5555-5555-5555-555555555555'
\set dana  '66666666-6666-6666-6666-666666666666'
\set eve   '77777777-7777-7777-7777-777777777777'

-- --- Mise en place (rôle postgres = admin) ---
reset role;
insert into auth.users (id, email, raw_user_meta_data) values
 (:'carla', 'carla@test.ca', '{"name":"Carla Plomberie"}'),
 (:'dana',  'dana@test.ca',  '{"name":"Dana Admin"}'),
 (:'eve',   'eve@test.ca',   '{"name":"Eve Déménage"}');
insert into admins (user_id) values (:'dana');

\echo '--- Registre vide : résultat registry_unavailable'
select rbq_check_licence('1111111111', '1234567890')->>'result' as resultat;

insert into rbq_licences (licence_no, name, neq, subcategories, restricted) values
 ('1111111111', 'Plomberie Carla inc.', '1234567890', array['15.5'], false),
 ('2222222222', 'Toitures X', '2222222222', array['7'], false),
 ('3333333333', 'Plomberie Suspendue', '3333333333', array['15.5'], true);
\echo '--- Vérif RBQ : ok, neq_mismatch, missing_subcategory, restricted, not_found'
select rbq_check_licence('1111111111', '1234567890')->>'result' as ok,
       rbq_check_licence('1111111111', '9999999999')->>'result' as neq,
       rbq_check_licence('2222222222', '2222222222')->>'result' as sous_cat,
       rbq_check_licence('3333333333', '3333333333')->>'result' as restreinte,
       rbq_check_licence('4444444444', '4444444444')->>'result' as absente;

set role authenticated;
select set_config('request.jwt.claim.sub', :'carla', false) \g /dev/null
\echo '--- Carla ne peut pas appeler rbq_check_licence directement (doit échouer)'
select rbq_check_licence('1111111111', '1234567890');
\echo '--- Plomberie sans licence RBQ (doit échouer), NEQ invalide (doit échouer)'
select submit_provider_application('Plomberie Carla', array['plumber'], '1234567890', '',
  95, 'Bio', :'carla' || '/id.jpg', :'carla' || '/ass.jpg');
select submit_provider_application('Plomberie Carla', array['plumber'], '12345', '1111-1111-11',
  95, 'Bio', :'carla' || '/id.jpg', :'carla' || '/ass.jpg');
\echo '--- Pièce dans le dossier de quelqu''un d''autre (doit échouer)'
select submit_provider_application('Plomberie Carla', array['plumber'], '1234567890', '1111-1111-11',
  95, 'Bio', :'bob' || '/id.jpg', :'carla' || '/ass.jpg');
\echo '--- Carla envoie sa demande (doit réussir), vérif RBQ ok'
select submit_provider_application('Plomberie Carla', array['plumber'], '1234567890', '1111-1111-11',
  95, 'Plombière à Rosemont', :'carla' || '/id.jpg', :'carla' || '/ass.jpg') is not null as envoyee;
select status, rbq_licence, rbq_check->>'result' as rbq, rbq_check->>'registry_name' as nom_registre
  from provider_applications;
\echo '--- Renvoyer pendant l''examen (doit échouer)'
select submit_provider_application('X', array['plumber'], '1234567890', '1111111111',
  95, '', :'carla' || '/id.jpg', :'carla' || '/ass.jpg');
\echo '--- Écriture directe : insert (doit échouer), update (0 ligne), s''ajouter admin (doit échouer)'
insert into provider_applications (user_id, business_name, services, neq, hourly_rate,
  id_document_path, insurance_path) values (:'carla', 'x', array['mover'], '1234567890', 1, 'a', 'b');
update provider_applications set status = 'approved';
select status from provider_applications;
insert into admins (user_id) values (:'carla');
select is_admin() as carla_admin;
\echo '--- Une demandeuse ne peut pas réserver (doit échouer)'
select create_booking('plumber', null, null, '{}', '[]', 'd', 1, 2);

\echo '--- Storage : Carla dépose dans son dossier (doit réussir), ailleurs (doit échouer)'
insert into storage.objects (bucket_id, name) values ('provider-documents', :'carla' || '/id.jpg');
insert into storage.objects (bucket_id, name) values ('provider-documents', :'bob' || '/id.jpg');

\echo '--- Alice (cliente avec réservations) et Paul (déjà prestataire) : refusés'
select set_config('request.jwt.claim.sub', :'alice', false) \g /dev/null
select submit_provider_application('A', array['mover'], '1234567890', null, 50, '',
  :'alice' || '/id.jpg', :'alice' || '/ass.jpg');
select set_config('request.jwt.claim.sub', :'paul', false) \g /dev/null
select submit_provider_application('P', array['plumber'], '1234567890', '1111111111', 50, '',
  :'paul' || '/id.jpg', :'paul' || '/ass.jpg');

\echo '--- Bob : ne voit ni la demande ni les pièces de Carla (0, 0), ne peut pas approuver'
select set_config('request.jwt.claim.sub', :'bob', false) \g /dev/null
select (select count(*) from provider_applications) as demandes,
       (select count(*) from storage.objects where bucket_id = 'provider-documents') as pieces;
select admin_approve_application((select id from provider_applications limit 1));
\echo '--- Bob : ni la liste des demandeurs ni l''état du registre (doivent échouer)'
select * from admin_list_applicants();
select * from admin_rbq_registry_status();

\echo '--- Eve (déménageuse) envoie sa demande : pas de vérif RBQ (null)'
select set_config('request.jwt.claim.sub', :'eve', false) \g /dev/null
select submit_provider_application('Déménagements Eve', array['mover'], '7777777777', '999',
  110, '', :'eve' || '/id.jpg', :'eve' || '/ass.jpg') is not null as envoyee;
select rbq_licence, rbq_check from provider_applications;

\echo '--- Dana (admin) voit les 2 demandes et les pièces de Carla (1)'
select set_config('request.jwt.claim.sub', :'dana', false) \g /dev/null
select is_admin() as dana_admin, (select count(*) from provider_applications) as demandes,
       (select count(*) from storage.objects where bucket_id = 'provider-documents') as pieces;
\echo '--- Dana : demandeurs (Carla, Eve) avec nom et courriel ; registre (3 licences, importé)'
select applicant_name, applicant_email from admin_list_applicants() order by 1;
select last_import is not null as importe, licence_count from admin_rbq_registry_status();
\echo '--- Refus sans motif (doit échouer), puis avec motif (doit réussir)'
select admin_reject_application((select id from provider_applications where user_id = :'eve'), ' ');
select admin_reject_application((select id from provider_applications where user_id = :'eve'),
  'Certificat d''assurance illisible');
\echo '--- Approbation de Carla : fiche vérifiée et reliée'
select admin_approve_application((select id from provider_applications where user_id = :'carla'))
  like 'p-%' as fiche_creee;
select p.name, p.services, p.verified, p.user_id = :'carla' as reliee
  from providers p join provider_applications a on a.provider_id = p.id;
\echo '--- Approuver à nouveau (doit échouer)'
select admin_approve_application((select id from provider_applications where user_id = :'carla'));

\echo '--- Carla est maintenant prestataire ; Eve voit le motif et renvoie (doit réussir)'
select set_config('request.jwt.claim.sub', :'carla', false) \g /dev/null
select current_provider_id() is not null as carla_prestataire;
select set_config('request.jwt.claim.sub', :'eve', false) \g /dev/null
select status, rejection_reason from provider_applications;
select submit_provider_application('Déménagements Eve', array['mover'], '7777777777', null,
  110, 'Camion 20 pieds', :'eve' || '/id2.jpg', :'eve' || '/ass2.jpg') is not null as renvoyee;
select status, rejection_reason, decided_at is null as decision_effacee from provider_applications;

\echo '--- Pièce d''identité d''Eve effacée (purge) : renvoi sans nouvelle pièce (doit échouer), avec (doit réussir)'
reset role;
update provider_applications set status = 'rejected', id_document_path = null,
  id_document_purged_at = now() where user_id = :'eve';
set role authenticated;
select set_config('request.jwt.claim.sub', :'eve', false) \g /dev/null
select submit_provider_application('Déménagements Eve', array['mover'], '7777777777', null,
  110, '', null, :'eve' || '/ass2.jpg');
select submit_provider_application('Déménagements Eve', array['mover'], '7777777777', null,
  110, '', :'eve' || '/id3.jpg', :'eve' || '/ass2.jpg') is not null as renvoyee;
select id_document_path is not null as piece, id_document_purged_at is null as purge_effacee
  from provider_applications;

\echo '--- Anon : ne lit aucune demande, pas d''erreur (0) ; is_admin interdit (doit échouer)'
reset role; set role anon;
select set_config('request.jwt.claim.sub', '', false) \g /dev/null
select count(*) as demandes from provider_applications;
select is_admin();
