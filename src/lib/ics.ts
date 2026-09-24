import { addDays, isTime, type IsoDate } from './dates';

/**
 * Génération d'un calendrier iCalendar (RFC 5545) abonnable depuis
 * Google Agenda, Apple Calendrier ou Outlook.
 */
export interface CalendarEntry {
  readonly uid: string;
  readonly date: IsoDate;
  readonly endDate?: IsoDate | undefined;
  /** HH:MM, heure de Paris. Absent = événement « journée entière ». */
  readonly start?: string | undefined;
  readonly end?: string | undefined;
  readonly summary: string;
  readonly location?: string | undefined;
  readonly description?: string | undefined;
  readonly categories?: readonly string[] | undefined;
  readonly url?: string | undefined;
}

export interface CalendarMeta {
  readonly name: string;
  readonly productId: string;
  readonly uidDomain: string;
  /** Horodatage DTSTAMP (moment de génération). */
  readonly stamp: Date;
}

const CRLF = '\r\n';
const MAX_OCTETS = 75;
const DEFAULT_DURATION = 'PT2H';

// Définition explicite du fuseau : la RFC impose un VTIMEZONE pour tout TZID.
const PARIS_TIMEZONE = [
  'BEGIN:VTIMEZONE',
  'TZID:Europe/Paris',
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
] as const;

export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Plie une ligne à 75 octets (et non 75 caractères) sans jamais couper
 * un caractère UTF-8 multi-octets : « é » ou « œ » restent intacts.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;
  let limit = MAX_OCTETS;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (currentBytes + size > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
      // Les lignes de continuation commencent par une espace (1 octet).
      limit = MAX_OCTETS - 1;
    }
    current += char;
    currentBytes += size;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

const compactDate = (value: IsoDate): string => value.replace(/-/g, '');
const compactTime = (value: string): string => `${value.replace(':', '')}00`;

function formatStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function assertTime(label: string, value: string | undefined): void {
  if (value !== undefined && !isTime(value)) {
    throw new RangeError(`${label} invalide : « ${value} » (format attendu HH:MM).`);
  }
}

function eventLines(entry: CalendarEntry, meta: CalendarMeta): string[] {
  assertTime('Heure de début', entry.start);
  assertTime('Heure de fin', entry.end);

  const lines = [
    'BEGIN:VEVENT',
    `UID:${entry.uid}@${meta.uidDomain}`,
    `DTSTAMP:${formatStamp(meta.stamp)}`,
  ];

  if (entry.start === undefined) {
    const lastDay = entry.endDate ?? entry.date;
    lines.push(`DTSTART;VALUE=DATE:${compactDate(entry.date)}`);
    // DTEND est exclusif pour les journées entières : lendemain du dernier jour.
    lines.push(`DTEND;VALUE=DATE:${compactDate(addDays(lastDay, 1))}`);
  } else {
    lines.push(`DTSTART;TZID=Europe/Paris:${compactDate(entry.date)}T${compactTime(entry.start)}`);
    if (entry.end === undefined) {
      lines.push(`DURATION:${DEFAULT_DURATION}`);
    } else {
      lines.push(`DTEND;TZID=Europe/Paris:${compactDate(entry.endDate ?? entry.date)}T${compactTime(entry.end)}`);
    }
  }

  lines.push(`SUMMARY:${escapeText(entry.summary)}`);
  if (entry.location) lines.push(`LOCATION:${escapeText(entry.location)}`);
  if (entry.description) lines.push(`DESCRIPTION:${escapeText(entry.description)}`);
  if (entry.categories?.length) lines.push(`CATEGORIES:${entry.categories.map(escapeText).join(',')}`);
  if (entry.url) lines.push(`URL:${entry.url}`);
  lines.push('END:VEVENT');
  return lines;
}

export function buildCalendar(entries: readonly CalendarEntry[], meta: CalendarMeta): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${meta.productId}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(meta.name)}`,
    'X-WR-TIMEZONE:Europe/Paris',
    ...PARIS_TIMEZONE,
    ...entries.flatMap((entry) => eventLines(entry, meta)),
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join(CRLF) + CRLF;
}
