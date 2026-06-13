export interface Formatters {
  formatPrice: (amount: number) => string;
  formatPriceRange: (range: { min: number; max: number }) => string;
  formatDateLong: (iso: string) => string;
  formatDateShort: (iso: string) => string;
  formatTime: (iso: string) => string;
  formatRelative: (iso: string) => string;
}

export function createFormatters(locale: string): Formatters {
  const cad = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  });
  const dateLong = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const dateShort = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });

  return {
    formatPrice(amount: number): string {
      return cad.format(amount);
    },

    formatPriceRange(range: { min: number; max: number }): string {
      return `${cad.format(range.min)} – ${cad.format(range.max)}`;
    },

    formatDateLong(iso: string): string {
      return dateLong.format(parseIso(iso));
    },

    formatDateShort(iso: string): string {
      return dateShort.format(parseIso(iso));
    },

    formatTime(iso: string): string {
      return time.format(new Date(iso));
    },

    /**
     * Compact timestamp for conversation lists:
     * time if today, "yesterday"/"hier", weekday if < 7 days, else short date.
     */
    formatRelative(iso: string): string {
      const date = new Date(iso);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dayDiff =
        Math.floor((startOfToday.getTime() - date.getTime()) / 86_400_000) + 1;

      if (date >= startOfToday) return time.format(date);
      if (dayDiff <= 1) return locale.startsWith('fr') ? 'hier' : 'yesterday';
      if (dayDiff < 7)
        return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date);
      return dateShort.format(date);
    },
  };
}

/** A date-only string (YYYY-MM-DD) must be parsed as local time, not UTC. */
function parseIso(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(iso);
}
