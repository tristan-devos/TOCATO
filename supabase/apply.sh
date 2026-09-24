#!/usr/bin/env bash
# Applique les fichiers SQL à la base Supabase PARTAGÉE (remplace le copier-coller
# dans le SQL editor). Même ordre que le SQL editor (voir AGENTS.md > Commandes).
#
# Garde-fou : la base partagée reflète toujours main. Le script refuse de tourner
# hors de main, avec des modifications locales, ou si main n'est pas à jour avec
# origin/main (piège de la PR #8 : du SQL d'une branche non mergée exécuté sur la
# base partagée). Pour tester une branche : supabase/tests/run.sh.
#
# Tout ou rien : les neuf fichiers passent dans UNE transaction ; à la première
# erreur, rien n'est appliqué.
#
# Connexion : SUPABASE_DB_URL (variable d'environnement, sinon lue dans .env) =
# chaîne « Session pooler » du Dashboard > Connect. psql tourne dans l'image
# postgres:16-alpine (Docker), pas besoin de l'installer.
set -euo pipefail
cd "$(dirname "$0")/.."
FILES="schema rpc transitions providers quotes applications photos admin policies"

# --- Garde-fou : main propre et à jour ---
branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != main ]; then
  echo "Refusé : branche '$branch'. La base partagée reflète main (git checkout main && git pull)." >&2
  exit 1
fi
if [ -n "$(git status --porcelain -- supabase/)" ]; then
  echo "Refusé : modifications locales dans supabase/ (git status)." >&2
  exit 1
fi
git fetch -q origin main
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  echo "Refusé : main n'est pas à jour avec origin/main (git pull)." >&2
  exit 1
fi

# --- Connexion ---
url=${SUPABASE_DB_URL:-}
if [ -z "$url" ] && [ -f .env ]; then
  url=$(sed -n 's/^SUPABASE_DB_URL=//p' .env | tail -n 1 | tr -d "\"'")
fi
if [ -z "$url" ]; then
  echo "SUPABASE_DB_URL manquante : l'ajouter dans .env (voir .env.example)." >&2
  exit 1
fi

# Hôte affiché sans le mot de passe, pour vérifier la cible avant d'écrire.
echo "Base : ${url#*@}"
echo "Fichiers : $FILES (commit $(git rev-parse --short HEAD))"
read -r -p "Appliquer ? [o/N] " answer
[ "$answer" = o ] || { echo "Annulé."; exit 0; }

# Le mot de passe passe par l'environnement du conteneur, pas par la ligne de commande.
# client_min_messages : masque les NOTICE des ré-exécutions (« already exists, skipping »).
{ echo 'set client_min_messages = warning;'; for f in $FILES; do cat "supabase/$f.sql"; done; } |
  docker run --rm -i -e PGURL="$url" postgres:16-alpine \
    sh -c 'psql "$PGURL" -v ON_ERROR_STOP=1 -q --single-transaction -f -'
echo "OK : la base partagée reflète main ($(git rev-parse --short HEAD))."
