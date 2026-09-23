// =============================================================================
// Edge Function `provider-reply` — simulation des réponses prestataire (serveur)
// =============================================================================
// L'app invoque cette fonction et la simulation insère les données « du
// prestataire » avec la clé service_role (hors RLS — le client n'a pas le droit
// d'insérer un message `provider` ni une conversation qu'il n'initie pas).
// Deux kinds :
//   - `initial` (bookingId) : chaque prestataire du service « vient vers le
//     client » — ouvre sa conversation sur la demande, envoie une intro puis un
//     devis. C'est le cœur du flux multi-prestataires.
//   - `canned` (conversationId) : réponse passe-partout dans une conversation
//     existante, quand le client écrit.
// Seules les fiches de DÉMO (providers.is_demo) sont simulées : `initial` ne fait
// répondre la démo que si aucun vrai prestataire (fiche reliée à un compte) ne
// couvre le service, et `canned` ne répond jamais à la place d'un vrai prestataire.
// Le Realtime répercute ensuite ces insertions dans l'app.
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

const FIRST_CONTACT_DELAY_MS = 2_500;
const QUOTE_DELAY_MS = 6_500;
const PROVIDER_STAGGER_MS = 6_000;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingRow {
  id: string;
  user_id: string;
  service_id: string;
  estimate_min: number;
  estimate_max: number;
}

interface ProviderRow {
  id: string;
  hourly_rate: number;
}

type ReplyKind = 'initial' | 'canned';
type Admin = ReturnType<typeof createClient>;

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
  admin: Admin,
  conversationId: string,
  providerId: string,
  message: {
    type: 'text' | 'quote';
    text: string;
    quote?: { amount: number; details: string; status: 'pending' };
  },
): Promise<void> {
  await admin.from('messages').insert({
    conversation_id: conversationId,
    sender_kind: 'provider',
    provider_id: providerId,
    type: message.type,
    text: message.text,
    quote: message.quote ?? null,
  });
}

/**
 * Un prestataire se manifeste sur une demande : ouvre sa conversation, se
 * présente, puis envoie un devis dérivé de l'estimation (varié par prestataire).
 */
async function runProviderContact(
  admin: Admin,
  booking: BookingRow,
  provider: ProviderRow,
  index: number,
): Promise<void> {
  await sleep(FIRST_CONTACT_DELAY_MS + index * PROVIDER_STAGGER_MS);

  const { data: conv } = await admin
    .from('conversations')
    .insert({ user_id: booking.user_id, provider_id: provider.id, booking_id: booking.id })
    .select('id')
    .single();
  if (!conv) return;
  const conversationId = String(conv.id);

  const { data: profile } = await admin
    .from('profiles')
    .select('name')
    .eq('id', booking.user_id)
    .single();
  const firstName = String(profile?.name ?? '').split(' ')[0] ?? '';

  await insertProviderMessage(admin, conversationId, provider.id, {
    type: 'text',
    text: `Bonjour ${firstName} ! J'ai vu votre demande, elle correspond à ce que je fais. Je vous prépare un devis.`,
  });

  await sleep(QUOTE_DELAY_MS);
  // Montant ancré au milieu de l'estimation, modulé par le taux horaire du
  // prestataire pour que les offres diffèrent, arrondi aux 5 $.
  const mid = (Number(booking.estimate_min) + Number(booking.estimate_max)) / 2;
  const spread = (index % 2 === 0 ? 1 : -1) * Number(provider.hourly_rate) * 0.2;
  const amount = Math.max(5, Math.round((mid + spread) / 5) * 5);
  await insertProviderMessage(admin, conversationId, provider.id, {
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

/**
 * Les prestataires de démo du service répondent à la demande, en décalé — sauf
 * si un vrai prestataire couvre le service : c'est alors à lui de répondre.
 */
async function runInitial(admin: Admin, booking: BookingRow): Promise<void> {
  const { count: realProviders } = await admin
    .from('providers')
    .select('id', { count: 'exact', head: true })
    .contains('services', [booking.service_id])
    .eq('is_demo', false)
    .not('user_id', 'is', null);
  if ((realProviders ?? 0) > 0) return;

  const { data: providers } = await admin
    .from('providers')
    .select('id, hourly_rate')
    .contains('services', [booking.service_id])
    .eq('is_demo', true);

  const tasks = (providers ?? []).map((provider, index) =>
    runProviderContact(
      admin,
      booking,
      { id: String(provider.id), hourly_rate: Number(provider.hourly_rate) },
      index,
    ),
  );
  await Promise.all(tasks);
}

/** Réponse passe-partout, l'index étant le nombre de messages client de la conv. */
async function runCanned(
  admin: Admin,
  conversationId: string,
  providerId: string,
): Promise<void> {
  const { count } = await admin
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('sender_kind', 'client');

  const index = (count ?? 1) - 1;
  const text =
    CANNED_REPLIES[((index % CANNED_REPLIES.length) + CANNED_REPLIES.length) % CANNED_REPLIES.length] ??
    'Bien reçu, merci !';

  await sleep(2_000 + Math.random() * 1_500);
  await insertProviderMessage(admin, conversationId, providerId, { type: 'text', text });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: 'not_configured' }, 500);

  let payload: { bookingId?: unknown; conversationId?: unknown; kind?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const kind: ReplyKind | null =
    payload.kind === 'initial' || payload.kind === 'canned' ? payload.kind : null;
  if (!kind) return json({ error: 'bad_request' }, 400);

  // Auth : on vérifie que l'appelant possède bien la ressource visée.
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return json({ error: 'unauthorized' }, 401);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  if (kind === 'initial') {
    const bookingId = typeof payload.bookingId === 'string' ? payload.bookingId : '';
    if (!bookingId) return json({ error: 'bad_request' }, 400);

    const { data: booking } = await admin
      .from('bookings')
      .select('id, user_id, service_id, estimate_min, estimate_max')
      .eq('id', bookingId)
      .single();
    if (!booking || booking.user_id !== user.id) return json({ error: 'not_found' }, 404);

    // Travail en arrière-plan : on répond tout de suite, les conversations et
    // messages arrivent après délai (le worker reste vivant grâce à waitUntil).
    EdgeRuntime.waitUntil(
      runInitial(admin, {
        id: String(booking.id),
        user_id: String(booking.user_id),
        service_id: String(booking.service_id),
        estimate_min: Number(booking.estimate_min),
        estimate_max: Number(booking.estimate_max),
      }),
    );
    return json({ ok: true });
  }

  const conversationId = typeof payload.conversationId === 'string' ? payload.conversationId : '';
  if (!conversationId) return json({ error: 'bad_request' }, 400);

  const { data: conv } = await admin
    .from('conversations')
    .select('id, user_id, provider_id')
    .eq('id', conversationId)
    .single();
  if (!conv || conv.user_id !== user.id) return json({ error: 'not_found' }, 404);

  // Jamais de réponse simulée à la place d'un vrai prestataire.
  const { data: provider } = await admin
    .from('providers')
    .select('is_demo')
    .eq('id', conv.provider_id)
    .single();
  if (!provider?.is_demo) return json({ ok: true, simulated: false });

  EdgeRuntime.waitUntil(runCanned(admin, String(conv.id), String(conv.provider_id)));
  return json({ ok: true });
});
