/**
 * Dates du calendrier prestataire (docs/experience-emotionnelle.md §6), sans
 * dépendance. Tout est en heure locale : une date de mission est une clé
 * `YYYY-MM-DD` (colonne `scheduled_date`, sans fuseau), jamais un instant UTC.
 */

/** 0 = dimanche, 1 = lundi. */
export type WeekStart = 0 | 1;

/** Lundi en français (fr-CA), dimanche en anglais (en-CA). */
export function weekStartFor(locale: string): WeekStart {
  return locale.startsWith('fr') ? 1 : 0;
}

/** Clé locale `YYYY-MM-DD` d'une date. */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Date locale (minuit) d'une clé `YYYY-MM-DD` ; aujourd'hui si la clé est invalide. */
export function fromDateKey(key: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return startOfDay(new Date());
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Premier jour du mois, décalé de `months` mois. */
export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function startOfWeek(date: Date, weekStart: WeekStart): Date {
  const offset = (date.getDay() - weekStart + 7) % 7;
  return addDays(startOfDay(date), -offset);
}

/** Les 7 jours de la semaine qui contient `date`. */
export function weekDays(date: Date, weekStart: WeekStart): Date[] {
  const first = startOfWeek(date, weekStart);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

/**
 * Grille du mois qui contient `date` : des semaines complètes (les jours des mois
 * voisins complètent la première et la dernière ; `inMonth` les distingue).
 */
export function monthGrid(date: Date, weekStart: WeekStart): { day: Date; inMonth: boolean }[][] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const month = first.getMonth();
  const weeks: { day: Date; inMonth: boolean }[][] = [];
  let cursor = startOfWeek(first, weekStart);
  do {
    weeks.push(
      weekDays(cursor, weekStart).map((day) => ({ day, inMonth: day.getMonth() === month })),
    );
    cursor = addDays(cursor, 7);
  } while (cursor.getMonth() === month);
  return weeks;
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
