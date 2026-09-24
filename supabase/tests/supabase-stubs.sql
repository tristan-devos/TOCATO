-- Stubs minimaux de Supabase pour tester schema/rpc/transitions hors projet réel.
create role anon nologin; create role authenticated nologin;
create schema auth; create schema storage;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth, storage, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id serial, bucket_id text, name text);
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
alter table storage.objects enable row level security;
-- Comme sur Supabase : droits de table accordés, l'accès réel est filtré par la RLS.
grant select, insert, delete on storage.objects to authenticated;
grant select on storage.objects to anon;
grant usage on sequence storage.objects_id_seq to authenticated;
create publication supabase_realtime;
alter default privileges in schema public grant all on tables to anon, authenticated;
