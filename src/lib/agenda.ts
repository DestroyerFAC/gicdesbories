import { isBefore, isIsoDate, isTime, monthKey, type IsoDate } from './dates';

export const AGENDA_CATEGORIES = {
  battue: {
    label: 'Battue',
    plural: 'Battues',
    description: 'Chasse collective au grand gibier. Le secteur est signalé par des panneaux « Chasse en cours ».',
  },
  association: {
    label: 'Vie du G.I.C.',
    plural: 'Vie du G.I.C.',
    description: 'Assemblées, réunions, repas de chasse.',
  },
  territoire: {
    label: 'Territoire',
    plural: 'Territoire',
    description: 'Journées d’entretien : lignes de tir, chemins, miradors, murets.',
  },
} as const;

export type AgendaCategory = keyof typeof AGENDA_CATEGORIES;

export interface AgendaEvent {
  /** Identifiant stable et unique. */
  readonly id: string;
  readonly date: IsoDate;
  readonly endDate?: IsoDate;
  readonly start?: string;
  readonly end?: string;
  readonly title: string;
  readonly category: AgendaCategory;
  readonly place: string;
  readonly details?: string;
}

export interface MonthGroup {
  readonly key: string;
  readonly firstDate: IsoDate;
  readonly events: readonly AgendaEvent[];
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Valide l'agenda au build : une date mal saisie fait échouer la
 * compilation plutôt que d'afficher une battue au mauvais jour.
 */
export function validateAgenda(events: readonly AgendaEvent[]): readonly AgendaEvent[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const event of events) {
    const where = `« ${event.id || event.title} »`;
    if (!ID_PATTERN.test(event.id)) problems.push(`${where} : identifiant invalide (minuscules, chiffres et tirets).`);
    if (seen.has(event.id)) problems.push(`${where} : identifiant en double.`);
    seen.add(event.id);
    if (!isIsoDate(event.date)) problems.push(`${where} : date invalide « ${event.date} ».`);
    if (event.endDate !== undefined) {
      if (!isIsoDate(event.endDate)) problems.push(`${where} : date de fin invalide « ${event.endDate} ».`);
      else if (isBefore(event.endDate, event.date)) problems.push(`${where} : la date de fin précède la date de début.`);
    }
    if (event.start !== undefined && !isTime(event.start)) problems.push(`${where} : heure de début invalide.`);
    if (event.end !== undefined && !isTime(event.end)) problems.push(`${where} : heure de fin invalide.`);
    if (event.end !== undefined && event.start === undefined) problems.push(`${where} : heure de fin sans heure de début.`);
    if (
      event.start !== undefined &&
      event.end !== undefined &&
      event.endDate === undefined &&
      event.end <= event.start
    ) {
      problems.push(`${where} : l'heure de fin doit suivre l'heure de début.`);
    }
    if (!Object.hasOwn(AGENDA_CATEGORIES, event.category)) problems.push(`${where} : catégorie inconnue.`);
    if (event.title.trim().length === 0) problems.push(`${where} : titre manquant.`);
  }

  if (problems.length > 0) {
    throw new Error(`Agenda invalide :\n- ${problems.join('\n- ')}`);
  }
  return sortEvents(events);
}

export function sortEvents(events: readonly AgendaEvent[]): AgendaEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? '').localeCompare(b.start ?? ''));
}

/** Dernier jour de l'événement : sert à savoir s'il est passé. */
export function lastDay(event: AgendaEvent): IsoDate {
  return event.endDate ?? event.date;
}

export function upcomingEvents(events: readonly AgendaEvent[], today: IsoDate): AgendaEvent[] {
  return sortEvents(events).filter((event) => !isBefore(lastDay(event), today));
}

export function groupByMonth(events: readonly AgendaEvent[]): MonthGroup[] {
  const groups = new Map<string, AgendaEvent[]>();
  for (const event of sortEvents(events)) {
    const key = monthKey(event.date);
    const bucket = groups.get(key);
    if (bucket) bucket.push(event);
    else groups.set(key, [event]);
  }
  return [...groups.entries()].map(([key, list]) => ({
    key,
    firstDate: (list[0] as AgendaEvent).date,
    events: list,
  }));
}
