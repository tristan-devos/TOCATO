/**
 * Brouillon de la fiche devis (docs/devis-et-fin-de-mission.md §4) et ses règles.
 *
 * Mêmes règles que le serveur (send_quote, supabase/quotes.sql), vérifiées ici pour
 * guider la saisie ; le serveur reste l'arbitre et recalcule le total.
 */

import { addDays, toDateKey } from '@/lib/calendar';
import { parseAmountInput } from '@/lib/format';
import type { OpenRequest, QuoteLine, QuoteLineCategory, TimeSlotId } from '@/lib/types';

export const MAX_QUOTE_LINES = 10;
/** Une date proposée tombe entre aujourd'hui et 60 jours plus tard. */
export const MAX_DAYS_AHEAD = 60;
export const QUOTE_CATEGORIES: QuoteLineCategory[] = ['labor', 'parts', 'travel', 'other'];

export interface QuoteDraftLine {
  /** Clé de liste stable (jamais envoyée). */
  key: string;
  label: string;
  category: QuoteLineCategory;
  /** Saisie brute (« 120 », « 120,50 »). */
  amountText: string;
}

export interface QuoteDraft {
  lines: QuoteDraftLine[];
  date: string | null;
  slot: TimeSlotId | null;
  /** Saisie brute, en heures (« 2 », « 2,5 »). */
  durationText: string;
  included: string;
  warranty: string;
}

/** Ce que reçoit la RPC send_quote. */
export interface QuoteInput {
  lines: QuoteLine[];
  proposedDate: string;
  proposedSlot: TimeSlotId;
  durationHours: number;
  included: string;
  warranty: string;
}

export type QuoteDraftError = 'lines' | 'date' | 'slot' | 'duration';

let lineCounter = 0;

export function newLine(category: QuoteLineCategory = 'labor'): QuoteDraftLine {
  lineCounter += 1;
  return { key: `line-${lineCounter}`, label: '', category, amountText: '' };
}

/** Jours proposables : d'aujourd'hui à +60 jours (clés YYYY-MM-DD). */
export function proposableDays(today: Date): string[] {
  return Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) => toDateKey(addDays(today, i)));
}

/**
 * Brouillon prérempli avec la date et le créneau demandés par le client, s'ils sont
 * encore proposables ; sinon à choisir (demande « dès que possible »).
 */
export function draftFor(request: OpenRequest, today: Date): QuoteDraft {
  const requested = request.scheduledDate;
  const date = requested && proposableDays(today).includes(requested) ? requested : null;
  return {
    lines: [newLine('labor')],
    date,
    slot: date ? (request.timeSlot ?? null) : null,
    durationText: '',
    included: '',
    warranty: '',
  };
}

export function parseDuration(text: string): number | null {
  const hours = parseAmountInput(text);
  return hours !== null && hours >= 0.5 && hours <= 24 ? hours : null;
}

/** Total des lignes valides (affiché en direct pendant la saisie). */
export function draftTotal(draft: QuoteDraft): number {
  return draft.lines.reduce((sum, line) => sum + (parseAmountInput(line.amountText) ?? 0), 0);
}

/** Brouillon -> données de la RPC, ou la première erreur à corriger. */
export function validateDraft(
  draft: QuoteDraft,
  today: Date,
): { input: QuoteInput } | { error: QuoteDraftError } {
  const lines: QuoteLine[] = [];
  for (const line of draft.lines) {
    const amount = parseAmountInput(line.amountText);
    const label = line.label.trim();
    if (amount === null || label.length === 0 || label.length > 80) return { error: 'lines' };
    lines.push({ label, category: line.category, amount });
  }
  if (lines.length === 0 || lines.length > MAX_QUOTE_LINES) return { error: 'lines' };
  if (!draft.date || !proposableDays(today).includes(draft.date)) return { error: 'date' };
  if (!draft.slot) return { error: 'slot' };
  const durationHours = parseDuration(draft.durationText);
  if (durationHours === null) return { error: 'duration' };
  return {
    input: {
      lines,
      proposedDate: draft.date,
      proposedSlot: draft.slot,
      durationHours,
      included: draft.included.trim(),
      warranty: draft.warranty.trim(),
    },
  };
}

/** La date proposée diffère-t-elle de celle demandée par le client ? */
export function differsFromRequested(proposedDate: string, requestedDate?: string): boolean {
  return requestedDate !== undefined && proposedDate !== requestedDate;
}
