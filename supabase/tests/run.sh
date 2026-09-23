#!/usr/bin/env bash
# Teste les fichiers SQL (ordre : FILES ci-dessous) dans un Postgres jetable (Docker),
# sans toucher au projet Supabase réel :
#   1. installation neuve, puis ré-exécution (idempotence) ;
#   2. mise à jour depuis la version de main (fichiers SQL de main puis ceux de
#      la branche) : c'est le chemin que suit la vraie base ;
#   3. scénarios RLS / RPC (scenarios*.sql), à relire : chaque bloc annonce le
#      résultat attendu.
# supabase-stubs.sql simule le strict nécessaire de Supabase (auth.uid(), rôles
# anon/authenticated, schéma storage, publication realtime).
set -euo pipefail
cd "$(dirname "$0")/.."
NAME=tocato-sqltest
# Ordre d'exécution, identique à celui du SQL editor (voir AGENTS.md > Commandes).
FILES="schema rpc transitions providers policies"
docker run -d --rm --name "$NAME" -e POSTGRES_PASSWORD=pw postgres:16-alpine >/dev/null
trap 'docker stop "$NAME" >/dev/null' EXIT
until docker exec "$NAME" pg_isready -U postgres -q; do sleep 1; done
sleep 2
# Échoue (et arrête le script) à la moindre erreur SQL : l'installation doit être propre.
psql_db() {
  local out
  if ! out=$(docker exec -i "$NAME" psql -U postgres -d "$1" -v ON_ERROR_STOP=1 -q 2>&1); then
    echo "$out" | grep -v -e NOTICE -e wal_level -e 'Set wal_level'
    echo "ÉCHEC : erreur SQL ci-dessus" >&2
    exit 1
  fi
}
docker exec "$NAME" psql -U postgres -q -c 'create database mig' >/dev/null

echo '== 1. Installation neuve + ré-exécution'
psql_db postgres < tests/supabase-stubs.sql
for pass in 1 2; do
  for f in $FILES; do psql_db postgres < "$f.sql"; done
done

echo '== 2. Mise à jour depuis main'
grep -v 'create role' tests/supabase-stubs.sql | psql_db mig
# Fichiers tels qu'ils sont sur main (seulement ceux qui y existent), puis la branche.
for f in $FILES; do
  if git cat-file -e "main:supabase/$f.sql" 2>/dev/null; then
    git show "main:supabase/$f.sql" | psql_db mig
  fi
done
for f in $FILES; do psql_db mig < "$f.sql"; done
docker exec "$NAME" psql -U postgres -d mig -At -c \
  "select tablename || '.' || policyname || ' (' || cmd || ')' from pg_policies where schemaname = 'public' order by 1"

echo '== 3. Scénarios'
# Ordre explicite : les scénarios prestataire réutilisent les comptes créés avant.
for f in tests/scenarios.sql tests/scenarios-provider.sql; do
  echo "--- $f"
  docker exec -i "$NAME" sh -c 'psql -U postgres -q 2>&1' < "$f"
done
