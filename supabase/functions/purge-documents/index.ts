// =============================================================================
// Edge Function `purge-documents` : conservation des pièces justificatives (Loi 25)
// =============================================================================
// Appelée chaque nuit par la GitHub Action « Import RBQ » (job purge-documents).
//  1. Pièce d'identité supprimée 30 jours après la décision de l'admin (approbation
//     ou refus) : fichier effacé du bucket, chemin remis à null, date gardée
//     (id_document_purged_at) comme trace. L'assurance reste tant que la demande existe.
//  2. Photo d'une demande refusée, 30 jours après la décision (même règle) : fichier
//     effacé du bucket provider-photos, chemin remis à null.
//  3. Fichiers orphelins des deux buckets effacés s'ils ont plus de 24 h (marge pour
//     un envoi en cours) : pièce ou photo remplacée lors d'un renvoi, demande ou compte
//     supprimé, photo remplacée par une nouvelle validée, photo proposée puis refusée.
//     Une photo publiée (providers.photo_path) est toujours référencée.
//
// Passe par l'API Storage avec la clé service_role : Supabase interdit de supprimer
// directement dans storage.objects en SQL (le fichier resterait stocké).
// Idempotente et sans paramètre : l'appeler en trop ne fait rien de plus. D'où
// l'appel avec la clé anon (publique) plutôt qu'un secret de plus.
//
// Runtime : Deno (Supabase Edge Runtime), exclu du tsconfig de l'app. Déploiement,
// toujours depuis main à jour :
//   npx supabase functions deploy purge-documents --project-ref <ref>
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY sont injectés automatiquement.
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Globals du runtime Edge (déclarés ici car ce fichier n'est pas vu par tsc app).
declare const Deno: {
  env: { get(key: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

const BUCKET = 'provider-documents';
const PHOTOS_BUCKET = 'provider-photos';
const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_DAYS = 30;
const ORPHAN_GRACE_MS = DAY_MS;
const LIST_LIMIT = 1000;

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);

interface ApplicationPaths {
  id: string;
  id_document_path: string | null;
  insurance_path: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** 1. Pièces d'identité dont la décision date de plus de RETENTION_DAYS jours. */
async function purgeExpiredIdDocuments(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS).toISOString();
  const { data, error } = await admin
    .from('provider_applications')
    .select('id, id_document_path')
    .lt('decided_at', cutoff)
    .not('id_document_path', 'is', null);
  if (error) throw new Error(`lecture des demandes : ${error.message}`);
  const due = (data ?? []).filter(
    (row): row is { id: string; id_document_path: string } => row.id_document_path !== null,
  );
  if (due.length === 0) return 0;

  const removal = await admin.storage.from(BUCKET).remove(due.map((row) => row.id_document_path));
  if (removal.error) throw new Error(`suppression des pièces : ${removal.error.message}`);
  const { error: updateError } = await admin
    .from('provider_applications')
    .update({ id_document_path: null, id_document_purged_at: new Date().toISOString() })
    .in('id', due.map((row) => row.id));
  if (updateError) throw new Error(`mise à jour des demandes : ${updateError.message}`);
  return due.length;
}

/** 2. Photos des demandes refusées depuis plus de RETENTION_DAYS jours. */
async function purgeRejectedApplicationPhotos(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * DAY_MS).toISOString();
  const { data, error } = await admin
    .from('provider_applications')
    .select('id, photo_path')
    .eq('status', 'rejected')
    .lt('decided_at', cutoff)
    .not('photo_path', 'is', null);
  if (error) throw new Error(`lecture des photos refusées : ${error.message}`);
  const due = (data ?? []).filter(
    (row): row is { id: string; photo_path: string } => row.photo_path !== null,
  );
  if (due.length === 0) return 0;

  const removal = await admin.storage.from(PHOTOS_BUCKET).remove(due.map((row) => row.photo_path));
  if (removal.error) throw new Error(`suppression des photos : ${removal.error.message}`);
  const { error: updateError } = await admin
    .from('provider_applications')
    .update({ photo_path: null })
    .in('id', due.map((row) => row.id));
  if (updateError) throw new Error(`mise à jour des demandes : ${updateError.message}`);
  return due.length;
}

/** Chemins encore utiles du bucket provider-documents : les pièces des demandes. */
async function referencedDocuments(): Promise<Set<string>> {
  const { data, error } = await admin
    .from('provider_applications')
    .select('id, id_document_path, insurance_path');
  if (error) throw new Error(`lecture des chemins : ${error.message}`);
  const referenced = new Set<string>();
  for (const row of (data ?? []) as ApplicationPaths[]) {
    if (row.id_document_path) referenced.add(row.id_document_path);
    referenced.add(row.insurance_path);
  }
  return referenced;
}

/**
 * Chemins encore utiles du bucket provider-photos : photos publiées, propositions en
 * attente, et photos des demandes pas encore approuvées (en examen, ou refusées depuis
 * moins de 30 jours). Celle d'une demande approuvée est la photo publiée tant que le
 * prestataire ne l'a pas changée : la fiche la référence déjà.
 */
async function referencedPhotos(): Promise<Set<string>> {
  const [providers, changes, applications] = await Promise.all([
    admin.from('providers').select('photo_path').not('photo_path', 'is', null),
    admin.from('provider_photo_changes').select('photo_path').eq('status', 'submitted'),
    admin
      .from('provider_applications')
      .select('photo_path')
      .neq('status', 'approved')
      .not('photo_path', 'is', null),
  ]);
  const referenced = new Set<string>();
  for (const result of [providers, changes, applications]) {
    if (result.error) throw new Error(`lecture des photos : ${result.error.message}`);
    for (const row of (result.data ?? []) as { photo_path: string | null }[]) {
      if (row.photo_path) referenced.add(row.photo_path);
    }
  }
  return referenced;
}

/** 3. Fichiers d'un bucket que plus rien ne référence, âgés de plus de 24 h. */
async function purgeOrphans(bucket: string, referenced: Set<string>): Promise<number> {
  // Premier niveau du bucket = un dossier par compte ({user_id}/...).
  const { data: folders, error: listError } = await admin.storage
    .from(bucket)
    .list('', { limit: LIST_LIMIT });
  if (listError) throw new Error(`liste du bucket : ${listError.message}`);

  const orphans: string[] = [];
  const graceLimit = Date.now() - ORPHAN_GRACE_MS;
  for (const folder of folders ?? []) {
    if (folder.id !== null) continue; // un fichier à la racine : format inattendu, on n'y touche pas
    const { data: files, error: filesError } = await admin.storage
      .from(bucket)
      .list(folder.name, { limit: LIST_LIMIT });
    if (filesError) throw new Error(`liste de ${folder.name} : ${filesError.message}`);
    for (const file of files ?? []) {
      const path = `${folder.name}/${file.name}`;
      const created = file.created_at ? Date.parse(file.created_at) : Date.now();
      if (!referenced.has(path) && created < graceLimit) orphans.push(path);
    }
  }
  if (orphans.length === 0) return 0;
  const removal = await admin.storage.from(bucket).remove(orphans);
  if (removal.error) throw new Error(`suppression des orphelins : ${removal.error.message}`);
  return orphans.length;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const idDocuments = await purgeExpiredIdDocuments();
    const rejectedPhotos = await purgeRejectedApplicationPhotos();
    const orphans = await purgeOrphans(BUCKET, await referencedDocuments());
    const orphanPhotos = await purgeOrphans(PHOTOS_BUCKET, await referencedPhotos());
    return json({ idDocuments, rejectedPhotos, orphans, orphanPhotos });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
