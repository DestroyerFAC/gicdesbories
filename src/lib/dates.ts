/**
 * Dates « calendaires » (sans heure) au format ISO AAAA-MM-JJ.
 *
 * Toutes les dates sont manipulées en UTC minuit et formatées avec
 * timeZone: 'UTC' : le rendu est identique que le build tourne à Paris
 * ou sur un serveur d'intégration continue réglé en UTC.
 */
export type IsoDate = `${number}-${number}-${number}`;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isIsoDate(value: string): value is IsoDate {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return (
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() === Number(m) - 1 &&
    date.getUTCDate() === Number(d)
  );
}

export function isTime(value: string): boolean {
  return TIME.test(value);
}

export function toUtcDate(value: string): Date {
  if (!isIsoDate(value)) {
    throw new RangeError(`Date invalide : « ${value} » (format attendu AAAA-MM-JJ).`);
  }
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10) as IsoDate;
}

export function addDays(value: IsoDate, days: number): IsoDate {
  const date = toUtcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

const formatters = {
  long: new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  dayMonth: new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'long' }),
  monthYear: new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', month: 'long', year: 'numeric' }),
  weekdayShort: new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'short' }),
  monthShort: new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', month: 'short' }),
  article: new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' }),
} as const;

export function formatLongDate(value: IsoDate): string {
  return formatters.long.format(toUtcDate(value));
}

export function formatArticleDate(date: Date): string {
  return formatters.article.format(date);
}

export function formatMonthYear(value: IsoDate): string {
  return formatters.monthYear.format(toUtcDate(value));
}

export function formatDayMonth(value: IsoDate): string {
  return formatters.dayMonth.format(toUtcDate(value));
}

export function weekdayShort(value: IsoDate): string {
  return formatters.weekdayShort.format(toUtcDate(value)).replace('.', '');
}

export function monthShort(value: IsoDate): string {
  return formatters.monthShort.format(toUtcDate(value)).replace('.', '');
}

export function dayOfMonth(value: IsoDate): number {
  return toUtcDate(value).getUTCDate();
}

/** « 8 h 00 », à la française. */
export function formatTime(value: string): string {
  const match = TIME.exec(value);
  if (!match) {
    throw new RangeError(`Heure invalide : « ${value} » (format attendu HH:MM).`);
  }
  return `${Number(match[1])} h ${match[2]}`;
}

/** Date du jour à Paris, quel que soit le fuseau du navigateur. */
export function todayInParis(now: Date = new Date()): IsoDate {
  // en-CA formate nativement en AAAA-MM-JJ.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now) as IsoDate;
}

/** Comparaison lexicographique : valable car le format ISO est de largeur fixe. */
export function isBefore(a: IsoDate, b: IsoDate): boolean {
  return a < b;
}

/** Saison cynégétique « 2026-2027 » : elle bascule au 1er juillet. */
export function huntingSeasonOf(value: IsoDate): string {
  const date = toUtcDate(value);
  const start = date.getUTCMonth() >= 6 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  return `${start}-${start + 1}`;
}

export function monthKey(value: IsoDate): string {
  return value.slice(0, 7);
}
