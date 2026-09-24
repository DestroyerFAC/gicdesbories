import { describe, expect, it } from 'vitest';
import { groupByMonth, upcomingEvents, validateAgenda, type AgendaEvent } from '@/lib/agenda';
import {
  addDays,
  formatLongDate,
  formatTime,
  huntingSeasonOf,
  isIsoDate,
  todayInParis,
  weekdayShort,
} from '@/lib/dates';
import { agenda } from '@/data/agenda';

const base: AgendaEvent = {
  id: 'test',
  date: '2026-10-11',
  title: 'Battue',
  category: 'battue',
  place: 'Saint-Jory',
};

describe('dates', () => {
  it('reconnaît les dates ISO réelles uniquement', () => {
    expect(isIsoDate('2026-10-11')).toBe(true);
    expect(isIsoDate('2026-02-30')).toBe(false);
    expect(isIsoDate('11/10/2026')).toBe(false);
  });

  it('formate en français sans décalage de fuseau', () => {
    expect(formatLongDate('2026-10-11')).toBe('dimanche 11 octobre 2026');
    expect(weekdayShort('2026-10-11')).toBe('dim');
    expect(formatTime('08:00')).toBe('8 h 00');
    expect(() => formatTime('8h')).toThrow(RangeError);
  });

  it('gère les changements de mois et d’année', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('calcule la date du jour à Paris', () => {
    // 23 h 30 UTC le 31/12 = 0 h 30 le 1er janvier à Paris.
    expect(todayInParis(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
  });

  it('bascule de saison au 1er juillet', () => {
    expect(huntingSeasonOf('2026-09-13')).toBe('2026-2027');
    expect(huntingSeasonOf('2027-02-14')).toBe('2026-2027');
    expect(huntingSeasonOf('2027-07-01')).toBe('2027-2028');
  });
});

describe('agenda', () => {
  it('trie et valide les événements', () => {
    const sorted = validateAgenda([
      { ...base, id: 'b', date: '2026-11-01' },
      { ...base, id: 'a', date: '2026-10-01' },
    ]);
    expect(sorted.map((event) => event.id)).toEqual(['a', 'b']);
  });

  it('signale toutes les erreurs de saisie', () => {
    expect(() =>
      validateAgenda([
        { ...base, id: 'Mauvais ID' },
        { ...base, id: 'x', date: '2026-13-01' as AgendaEvent['date'] },
        { ...base, id: 'y', start: '10:00', end: '09:00' },
        { ...base, id: 'y' },
      ]),
    ).toThrow(/identifiant invalide[\s\S]*date invalide[\s\S]*heure de fin[\s\S]*en double/);
  });

  it('ne garde que les événements à venir, jour même compris', () => {
    const events = [
      { ...base, id: 'passe', date: '2026-10-01' as const },
      { ...base, id: 'aujourdhui', date: '2026-10-11' as const },
      { ...base, id: 'multi', date: '2026-10-09' as const, endDate: '2026-10-12' as const },
    ];
    expect(upcomingEvents(events, '2026-10-11').map((event) => event.id)).toEqual(['multi', 'aujourdhui']);
  });

  it('regroupe par mois', () => {
    const groups = groupByMonth([
      { ...base, id: 'a', date: '2026-10-01' },
      { ...base, id: 'b', date: '2026-10-20' },
      { ...base, id: 'c', date: '2026-11-02' },
    ]);
    expect(groups.map((group) => [group.key, group.events.length])).toEqual([
      ['2026-10', 2],
      ['2026-11', 1],
    ]);
  });

  it('les données publiées sont valides', () => {
    expect(agenda.length).toBeGreaterThan(0);
  });
});
