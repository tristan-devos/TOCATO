// =============================================================================
// Edge Function `provider-reply` — simulation des réponses prestataire (serveur)
// =============================================================================
// Remplace l'ancien `src/lib/provider-sim.ts` (setTimeout côté client). L'app
// invoque cette fonction (« réponds dans cette conversation, type initial|canned »)
// ; la fonction insère les messages « du prestataire » avec la clé service_role
// (donc hors RLS — le client n'a plus le droit d'insérer un message `provider`).
// Le Realtime répercute ensuite ces messages dans l'app comme avant.
//
// Runtime : Deno (Supabase Edge Runtime). Ce dossier est exclu du tsconfig de
// l'app (code Deno, imports distants). Déploiement :
//   supabase functions deploy provider-reply --project-ref <ref>
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY sont injectés
// automatiquement par Supabase dans l'environnement de la fonction.
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Globals du runtime Edge (déclarés ici car ce fichier n'est pas vu par tsc app).
declare const Deno: { env: { get(key: string): string | undefined }; serve: (h: (req: Request) => Response | Promise<Response>) => void };
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Réponses passe-partout (déplacées de mock-data.ts vers le serveur).
const CANNED_REPLIES: string[] = [
  "Parfait, c'est noté !",
  'Très bonne question — oui, tout le matériel de base est inclus.',
  "Je vous confirme ça d'ici la fin de la journée.",
  "Pas de souci, je m'adapte à votre horaire.",
  "Merci pour la précision, ça m'aide à bien préparer l'intervention.",
];

const ACK_DELAY_MS = 2_500;
const QUOTE_DELAY_MS = 9_000;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConversationRow {
  id: string;
  user_id: string;
  provider_id: string;
  booking_id: string;
}

type ReplyKind = 'initial' | 'canned';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/** Insère un message prestataire (échoue silencieusement si la conv a disparu). */
async function insertProviderMessage(
  admin: ReturnType<typeof createClient>,
  conv: ConversationRow,
  message: {
    type: 'text' | 'quote';
    text: string;
    quote?: { amount: number; details: string; status: 'pending' };
  },
): Promise<void> {
  await admin.from('messages').insert({
    conversation_id: conv.id,
    sender_kind: 'provider',
    provider_id: conv.provider_id,
    type: message.type,
    text: message.text,
    quote: message.quote ?? null,
  });
}

/** Accusé de réception (2,5 s) puis devis chiffré (9 s), dérivés de la base. */
async function runInitial(
  admin: ReturnType<typeof createClient>,
  conv: ConversationRow,
): Promise<void> {
  const { data: booking } = await admin
    .from('bookings')
    .select('estimate_min, estimate_max')
    .eq('id', conv.booking_id)
    .single();
  const { data: profile } = await admin
    .from('profiles')
    .select('name')
    .eq('id', conv.user_id)
    .single();

  const min = Number(booking?.estimate_min ?? 0);
  const max = Number(booking?.estimate_max ?? 0);
  const firstName = String(profile?.name ?? '').split(' ')[0] ?? '';

  await sleep(ACK_DELAY_MS);
  await insertProviderMessage(admin, conv, {
    type: 'text',
    text: `Bonjour ${firstName} ! J'ai bien reçu votre demande, je la regarde et je vous envoie un devis rapidement.`,
  });

  await sleep(QUOTE_DELAY_MS - ACK_DELAY_MS);
  const amount = Math.round((min + max) / 2 / 5) * 5;
  await insertProviderMessage(admin, conv, {
    type: 'quote',
    text: 'Voici mon devis détaillé pour votre demande.',
    quote: {
      amount,
      details:
        "Main-d'œuvre, déplacement et matériel de base inclus. Ajustable après visite si besoin.",
      status: 'pending',
    },
  });
}

/** Réponse passe-partout, l'index étant le nombre de messages client de la conv. */
async function runCanned(
  admin: ReturnType<typeof createClient>,
  conv: ConversationRow,
): Promise<void> {
  const { count } = await admin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conv.id)
    .eq('sender_kind', 'client');

  const index = (count ?? 1) - 1;
  const text =
    CANNED_REPLIES[((index % CANNED_REPLIES.length) + CANNED_REPLIES.length) % CANNED_REPLIES.length] ??
    'Bien reçu, merci !';

  await sleep(2_000 + Math.random() * 1_500);
  await insertProviderMessage(admin, conv, { type: 'text', text });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: 'not_configured' }, 500);

  let payload: { conversationId?: unknown; kind?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const conversationId = typeof payload.conversationId === 'string' ? payload.conversationId : '';
  const kind: ReplyKind | null =
    payload.kind === 'initial' || payload.kind === 'canned' ? payload.kind : null;
  if (!conversationId || !kind) return json({ error: 'bad_request' }, 400);

  // Auth : on vérifie que l'appelant possède bien la conversation visée.
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return json({ error: 'unauthorized' }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { data: conv } = await admin
    .from('conversations')
    .select('id, user_id, provider_id, booking_id')
    .eq('id', conversationId)
    .single();
  if (!conv || conv.user_id !== user.id) return json({ error: 'not_found' }, 404);

  const conversation: ConversationRow = {
    id: String(conv.id),
    user_id: String(conv.user_id),
    provider_id: String(conv.provider_id),
    booking_id: String(conv.booking_id),
  };

  // Travail en arrière-plan : on répond tout de suite, les messages arrivent
  // après délai (le worker reste vivant grâce à waitUntil).
  const task = kind === 'initial' ? runInitial(admin, conversation) : runCanned(admin, conversation);
  EdgeRuntime.waitUntil(task);

  return json({ ok: true });
});
