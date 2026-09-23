#!/usr/bin/env bash
# Importe le registre des licences RBQ actives (données ouvertes, CC-BY 4.0) dans
# public.rbq_licences. Lancé chaque nuit par .github/workflows/rbq-import.yml, et à la
# main en secours : supabase/rbq-import.sh
#
# Source : Régie du bâtiment du Québec, via Données Québec (jeu « licencesactives »,
# mis à jour chaque jour). Le zip (~11 Mo) contient un CSV de ~340 Mo, une ligne par
# sous-catégorie : on le lit en streaming et on garde une ligne par licence
# d'ENTREPRENEUR, avec toutes ses sous-catégories (la vérification distingue ainsi
# « licence sans la 15.5 » de « licence inconnue »).
#
# Tout ou rien : la table est remplacée dans UNE transaction. Garde-fou : refus si le
# fichier donne moins de MIN_ROWS licences (téléchargement tronqué, format changé),
# pour ne jamais vider le registre sur une erreur.
#
# Connexion : SUPABASE_DB_URL (secret GitHub dans l'Action, sinon lue dans .env).
# Ne touche qu'aux données de rbq_licences, pas au schéma : pas de garde-fou « main ».
set -euo pipefail
cd "$(dirname "$0")/.."
DATASET_URL="https://www.donneesquebec.ca/recherche/dataset/755b45d6-7aee-46df-a216-748a0191c79f/resource/32f6ec46-85fd-45e9-945b-965d9235840a/download/rdl01_extractiondonneesouvertes.zip"
MIN_ROWS=20000

url=${SUPABASE_DB_URL:-}
if [ -z "$url" ] && [ -f .env ]; then
  url=$(sed -n 's/^SUPABASE_DB_URL=//p' .env | tail -n 1 | tr -d "\"'")
fi
if [ -z "$url" ]; then
  echo "SUPABASE_DB_URL manquante (secret GitHub, ou .env en local)." >&2
  exit 1
fi

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
echo "Téléchargement du registre RBQ…"
curl -fsSL --retry 3 -o "$work/rbq.zip" "$DATASET_URL"
unzip -q -o "$work/rbq.zip" -d "$work"
csv=$(find "$work" -name '*.csv' | head -n 1)
[ -n "$csv" ] || { echo "Aucun CSV dans le zip (format changé ?)." >&2; exit 1; }

# CSV -> TSV prêt pour COPY : licence, nom, NEQ, sous-catégories ({a,b}), restreinte,
# municipalité. Numéros sans tirets. Restriction active = « Oui » et aujourd'hui dans
# ses dates (bornes vides = ouvertes).
python3 - "$csv" "$work/rbq.tsv" "$MIN_ROWS" <<'PY'
import csv, datetime, sys
src, dst, min_rows = sys.argv[1], sys.argv[2], int(sys.argv[3])
today = datetime.date.today().isoformat()
digits = lambda s: ''.join(c for c in s if c.isdigit())
clean = lambda s: s.replace('\t', ' ').replace('\n', ' ').replace('\\', '/').strip()
licences = {}
with open(src, encoding='utf-8', newline='') as f:
    for row in csv.DictReader(f):
        if not row['Type de licence'].startswith('Entrepreneur'):
            continue
        no = digits(row['Numéro de licence'])
        if len(no) != 10:
            continue
        lic = licences.setdefault(no, {
            'name': clean(row["Nom de l'intervenant"]), 'neq': digits(row['NEQ']),
            'subs': set(), 'restricted': False, 'city': clean(row['Municipalité'])})
        sub = row['Sous-catégories'].strip()
        if sub:
            lic['subs'].add(sub)
        start, end = row['Date de début de la restriction'], row['Date de fin de la restriction']
        if row['Restriction'] == 'Oui' and (not start or start <= today) and (not end or end >= today):
            lic['restricted'] = True
if len(licences) < min_rows:
    sys.exit(f'Seulement {len(licences)} licences lues (minimum {min_rows}) : import annulé.')
with open(dst, 'w', encoding='utf-8') as out:
    for no, l in licences.items():
        subs = '{' + ','.join('"%s"' % s.replace('"', '') for s in sorted(l['subs'])) + '}'
        neq = l['neq'] if len(l['neq']) == 10 else '\\N'
        out.write('\t'.join([no, l['name'], neq, subs, 't' if l['restricted'] else 'f', l['city']]) + '\n')
print(f'{len(licences)} licences d\'entrepreneur prêtes.')
PY

{
  echo 'set client_min_messages = warning;'
  echo 'create temp table rbq_import (licence_no text, name text, neq text, subcategories text[], restricted boolean, municipality text) on commit drop;'
  echo 'copy rbq_import from stdin;'
  cat "$work/rbq.tsv"
  echo '\.'
  echo 'delete from public.rbq_licences;'
  echo 'insert into public.rbq_licences (licence_no, name, neq, subcategories, restricted, municipality, imported_at)'
  echo '  select licence_no, name, neq, subcategories, restricted, municipality, now() from rbq_import;'
  echo "select count(*) || ' licences importées, dont ' || count(*) filter (where '15.5' = any (subcategories)) || ' en plomberie (15.5).' from public.rbq_licences;"
} | docker run --rm -i -e PGURL="$url" postgres:16-alpine \
    sh -c 'psql "$PGURL" -v ON_ERROR_STOP=1 -q -t --single-transaction -f -'
