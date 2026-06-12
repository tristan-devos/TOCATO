/**
 * Formatage des dates et montants, locale fr-CA (Montréal).
 */

const CAD = new Intl.NumberFormat('fr-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return CAD.format(amount);
}

export function formatPriceRange(range: { min: number; max: number }): string {
  return `${CAD.format(range.min)} – ${CAD.format(range.max)}`;
}

const DATE_LONG = new Intl.DateTimeFormat('fr-CA', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const DATE_SHORT = new Intl.DateTimeFormat('fr-CA', {
  day: 'numeric',
  month: 'short',
});

const TIME = new Intl.DateTimeFormat('fr-CA', {
  hour: 'numeric',
  minute: '2-digit',
});

/** « jeudi 15 juin » — accepte un ISO date-time ou date seule. */
export function formatDateLong(iso: string): string {
  return DATE_LONG.format(parseIso(iso));
}

/** « 15 juin » */
export function formatDateShort(iso: string): string {
  return DATE_SHORT.format(parseIso(iso));
}

/** Heure d'un message : « 14 h 05 » */
export function formatTime(iso: string): string {
  return TIME.format(new Date(iso));
}

/**
 * Horodatage compact pour les listes de conversations :
 * heure si aujourd'hui, « hier », jour de la semaine si < 7 jours, sinon date courte.
 */
export function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDiff = Math.floor((startOfToday.getTime() - date.getTime()) / 86_400_000) + 1;

  if (date >= startOfToday) return TIME.format(date);
  if (dayDiff <= 1) return 'hier';
  if (dayDiff < 7) return new Intl.DateTimeFormat('fr-CA', { weekday: 'long' }).format(date);
  return DATE_SHORT.format(date);
}

/** Une date seule (YYYY-MM-DD) doit être interprétée en heure locale, pas UTC. */
function parseIso(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(iso);
}
